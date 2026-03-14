/** Serializable document data passed from Server Component to Client Components */
export type ChatDocument = {
  id: string;
  name: string;
  author: string | null;
  page_count: number | null;
  size: number;
  blob_url: string;
  current_page: number;
};
