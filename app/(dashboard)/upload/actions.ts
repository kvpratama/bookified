"use server";

import { del } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";
import { saveDocumentSchema } from "./upload-schema";
import { triggerIngestion } from "@/app/(dashboard)/actions";

export async function saveDocumentAction(data: {
  name: string;
  author?: string;
  pageCount?: number;
  blobUrl: string;
  thumbnailUrl?: string;
  size: number;
}) {
  const result = saveDocumentSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Check for existing document with the same name for this user
  const { data: existingDoc } = await supabase
    .from("documents")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", data.name)
    .maybeSingle();

  if (existingDoc) {
    return { error: "A document with this name already exists" };
  }

  try {
    // Database Record Creation
    const { data: document, error: dbError } = await supabase
      .from("documents")
      .insert({
        name: data.name,
        author: data.author || null,
        page_count: data.pageCount || null,
        blob_url: data.blobUrl,
        thumbnail_url: data.thumbnailUrl || null,
        size: data.size,
        user_id: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB Error:", dbError);
      throw new Error("Database insertion failed");
    }

    // Trigger ingestion in the background (non-blocking)
    // Errors are logged but don't fail the save operation
    triggerIngestion(document.id).catch((err) => {
      console.error("Failed to trigger ingestion:", err);
    });

    return { data: document };
  } catch (err) {
    console.error("Save error:", err);
    return { error: "Failed to save document information" };
  }
}

export async function deleteBlobsAction(urls: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const validUrls = urls.filter((url) => {
    try {
      const pathname = new URL(url).pathname.replace(/^\//, "");
      return pathname.startsWith(`${user.id}/`);
    } catch {
      return false;
    }
  });

  try {
    await del(validUrls, {
      token: process.env.BOOKIFIED_BLOB_READ_WRITE_TOKEN!,
    });
  } catch (err) {
    console.error("Blob cleanup error:", err);
  }

  return { data: null };
}
