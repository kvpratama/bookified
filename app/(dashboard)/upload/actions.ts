"use server";

import { put, del, type PutBlobResult } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";
import { uploadMetadataSchema, type UploadMetadata } from "./upload-schema";

export async function uploadDocumentAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const file = formData.get("file") as File | null;
  const metadataRaw = formData.get("metadata") as string | null;
  const thumbnailDataUrl = formData.get("thumbnail") as string | null;

  if (!file || !(file instanceof File)) {
    return { error: "No file provided" };
  }

  if (!metadataRaw) {
    return { error: "Metadata is required" };
  }

  let metadata: UploadMetadata;
  try {
    const parsed = uploadMetadataSchema.safeParse(JSON.parse(metadataRaw));
    if (!parsed.success) {
      return { error: "Invalid metadata", details: parsed.error.flatten() };
    }
    metadata = parsed.data;
  } catch {
    return { error: "Failed to parse metadata" };
  }

  // Check for existing document with the same name for this user
  const { data: existingDoc } = await supabase
    .from("documents")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", metadata.name)
    .maybeSingle();

  if (existingDoc) {
    return { error: "A document with this name already exists" };
  }

  const blobToken = process.env.BOOKIFIED_BLOB_READ_WRITE_TOKEN!;
  const docFolder = `${user.id}/${file.name.replace(/\.pdf$/i, "")}`;
  const blobUrlsToCleanup: string[] = [];

  try {
    // Stage 1: Upload PDF and Thumbnail in parallel
    const uploads: Promise<PutBlobResult>[] = [];

    // PDF Upload
    const pdfUpload = put(`${docFolder}/${file.name}`, file, {
      access: "private",
      addRandomSuffix: false,
      token: blobToken,
    });
    uploads.push(pdfUpload);

    // Thumbnail Upload (if exists)
    let thumbnailUpload: Promise<PutBlobResult> | null = null;
    if (thumbnailDataUrl) {
      const base64Data = thumbnailDataUrl.replace(
        /^data:image\/png;base64,/,
        "",
      );
      const thumbnailBuffer = Buffer.from(base64Data, "base64");
      thumbnailUpload = put(
        `${docFolder}/${file.name.replace(/\.pdf$/i, "")}.png`,
        thumbnailBuffer,
        {
          access: "private",
          addRandomSuffix: false,
          contentType: "image/png",
          token: blobToken,
        },
      );
      uploads.push(thumbnailUpload);
    }

    const [pdfBlob, thumbnailBlob] = await Promise.all(uploads);

    blobUrlsToCleanup.push(pdfBlob.url);
    if (thumbnailBlob) {
      blobUrlsToCleanup.push(thumbnailBlob.url);
    }

    // Stage 2: Database Record Creation
    const { data: document, error: dbError } = await supabase
      .from("documents")
      .insert({
        name: metadata.name,
        author: metadata.author || null,
        page_count: metadata.pageCount || null,
        blob_url: pdfBlob.url,
        thumbnail_url: thumbnailBlob?.url || null,
        size: file.size,
        user_id: user.id,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error("Database insertion failed");
    }

    return { data: document };
  } catch (err) {
    // Cleanup blobs on failure
    if (blobUrlsToCleanup.length > 0) {
      await del(blobUrlsToCleanup, { token: blobToken }).catch(() => {});
    }
    console.error("Upload error:", err);
    return { error: "Failed to upload document" };
  }
}
