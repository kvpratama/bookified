export function validateRedirect(url: string | undefined): string {
  if (!url || !url.startsWith("/") || url.startsWith("//")) {
    return "/dashboard";
  }
  try {
    new URL(url, "http://localhost");
    return url;
  } catch {
    return "/dashboard";
  }
}
