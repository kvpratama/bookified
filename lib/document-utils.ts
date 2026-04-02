/**
 * Checks if a document should show the "New" badge:
 * - Not yet accessed
 * - Uploaded within the last 7 days
 */
export function isDocumentNew(
  uploadDate: string,
  lastAccessed: string | null,
): boolean {
  if (lastAccessed) return false;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return new Date(uploadDate) >= sevenDaysAgo;
}
