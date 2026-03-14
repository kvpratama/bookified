import type { Tables } from "@/lib/supabase/database.types";

/** Serializable document data passed from Server Component to Client Components */
export type ChatDocument = Pick<
  Tables<"documents">,
  "id" | "name" | "author" | "page_count" | "size" | "blob_url" | "current_page"
>;
