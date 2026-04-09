import { createClient } from "@/lib/supabase/server";

const WELCOME_DOC_NAME = "Welcome to Sanctuary.pdf";
const WELCOME_DOC_AUTHOR = "Sanctuary Team";
const WELCOME_DOC_SIZE = 37121;

export async function seedWelcomeDocument(userId: string): Promise<void> {
  const blobUrl = process.env.WELCOME_DOCUMENT_BLOB_URL;
  if (!blobUrl) return;

  const thumbnailUrl = process.env.WELCOME_DOCUMENT_THUMBNAIL_URL || null;

  try {
    const supabase = await createClient();

    const { count } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .limit(1);

    if (count && count > 0) return;

    const { data: doc, error } = await supabase
      .from("documents")
      .insert({
        name: WELCOME_DOC_NAME,
        author: WELCOME_DOC_AUTHOR,
        page_count: 1,
        blob_url: blobUrl,
        thumbnail_url: thumbnailUrl,
        size: WELCOME_DOC_SIZE,
        user_id: userId,
      })
      .select("id")
      .single();

    if (error || !doc) {
      console.error("Failed to seed welcome document:", error?.message);
      return;
    }

    const endpoint = process.env.BOOKIFIED_API_ENDPOINT;
    if (!endpoint) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;

    fetch(`${endpoint}/ingest/${doc.id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch((err) => {
      console.error("Failed to trigger welcome doc ingestion:", err);
    });
  } catch (err) {
    console.error("Error seeding welcome document:", err);
  }
}
