"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveDocumentAction(data: {
  name: string;
  author?: string;
  pageCount?: number;
  blobUrl: string;
  thumbnailUrl?: string;
  size: number;
}) {
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

    return { data: document };
  } catch (err) {
    console.error("Save error:", err);
    return { error: "Failed to save document information" };
  }
}
