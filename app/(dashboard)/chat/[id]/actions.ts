"use server";

import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";

type UpdateResult = {
  data: null;
  error: string | null;
};

type TriggerIngestionResult = {
  data: { triggered: boolean } | null;
  error: string | null;
};

export async function triggerIngestion(
  documentId: string,
): Promise<TriggerIngestionResult> {
  try {
    const supabase = await createClient();
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

export async function updateDocumentProgress(
  documentId: string,
  currentPage: number,
): Promise<UpdateResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("documents")
      .update({
        current_page: currentPage,
        last_accessed: new Date().toISOString(),
      } as TablesUpdate<"documents">)
      .eq("id", documentId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to update document progress:", error);
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error updating document progress:", message);
    return { data: null, error: message };
  }
}
