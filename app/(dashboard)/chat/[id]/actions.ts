"use server";

import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";

type UpdateResult = {
  data: null;
  error: string | null;
};

export async function updateDocumentProgress(
  documentId: string,
  currentPage: number,
  lastAccessed: string,
): Promise<UpdateResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("documents")
      .update({
        current_page: currentPage,
        last_accessed: lastAccessed,
      } as TablesUpdate<"documents">)
      .eq("id", documentId);

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
