"use server";

import { createClient } from "@/lib/supabase/server";

type TriggerIngestionResult = {
  data: { triggered: boolean } | null;
  error: string | null;
};

export async function triggerIngestion(
  documentId: string,
): Promise<TriggerIngestionResult> {
  try {
    const supabase = await createClient();

    // Check if ingestion is already in progress or completed
    const { data: doc, error: queryError } = await supabase
      .from("documents")
      .select("is_ingesting, ingested_at")
      .eq("id", documentId)
      .single();

    if (queryError) {
      console.log("DEBUG: queryError found:", queryError);
      return { data: null, error: queryError.message };
    }

    if (doc.is_ingesting || doc.ingested_at) {
      console.log("INFO: doc is already ingesting or ingested");
      return { data: { triggered: false }, error: null };
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { data: null, error: "Unauthorized" };
    }

    const endpoint = process.env.BOOKIFIED_API_ENDPOINT;
    if (!endpoint) {
      return { data: null, error: "Ingestion endpoint not configured" };
    }

    if (process.env.NODE_ENV === "test") {
      console.trace("DEBUG: calling fetch now");
    }
    const res = await fetch(`${endpoint}/ingest/${documentId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!res.ok) {
      return {
        data: null,
        error: `Ingestion failed with status ${res.status}`,
      };
    }

    return { data: { triggered: true }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to trigger ingestion:", message);
    return { data: null, error: message };
  }
}
