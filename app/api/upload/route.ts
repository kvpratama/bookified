import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";
import { uploadMetadataSchema } from "@/app/(dashboard)/upload/upload-schema";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const metadataRaw = formData.get("metadata");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are accepted" },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File size exceeds 10MB limit" },
      { status: 400 },
    );
  }

  if (!metadataRaw || typeof metadataRaw !== "string") {
    return NextResponse.json(
      { error: "Metadata is required" },
      { status: 400 },
    );
  }

  const parsed = uploadMetadataSchema.safeParse(JSON.parse(metadataRaw));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid metadata", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const metadata = parsed.data;
  const blobToken = process.env.BOOKIFIED_BLOB_READ_WRITE_TOKEN!;
  const docFolder = `${user.id}/${file.name.replace(/\.pdf$/i, "")}`;
  const blobUrlsToCleanup: string[] = [];

  try {
    // Step 1: Upload PDF to Vercel Blob
    const pdfBlob = await put(`${docFolder}/${file.name}`, file, {
      access: "private",
      addRandomSuffix: false,
      token: blobToken,
    });
    blobUrlsToCleanup.push(pdfBlob.url);

    // Step 2: Upload thumbnail to Vercel Blob
    let thumbnailUrl: string | null = null;
    const thumbnailDataUrl = formData.get("thumbnail");
    if (thumbnailDataUrl && typeof thumbnailDataUrl === "string") {
      const base64Data = thumbnailDataUrl.replace(
        /^data:image\/png;base64,/,
        "",
      );
      const thumbnailBuffer = Buffer.from(base64Data, "base64");
      const thumbnailBlob = await put(
        `${docFolder}/${file.name.replace(/\.pdf$/i, "")}.png`,
        thumbnailBuffer,
        {
          access: "private",
          addRandomSuffix: false,
          contentType: "image/png",
          token: blobToken,
        },
      );
      blobUrlsToCleanup.push(thumbnailBlob.url);
      thumbnailUrl = thumbnailBlob.url;
    }

    // Step 3: Insert into Supabase (only if both uploads succeeded)
    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        name: metadata.name,
        author: metadata.author || null,
        page_count: metadata.pageCount || null,
        blob_url: pdfBlob.url,
        thumbnail_url: thumbnailUrl,
        size: file.size,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      await del(blobUrlsToCleanup, { token: blobToken });
      return NextResponse.json(
        { error: "Failed to save document" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: document });
  } catch {
    // Clean up any successfully uploaded blobs
    if (blobUrlsToCleanup.length > 0) {
      await del(blobUrlsToCleanup, { token: blobToken }).catch(() => {});
    }
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 },
    );
  }
}
