import type { ExtractedMetadata } from "./upload-schema";

export async function extractPdfMetadata(
  file: File,
): Promise<ExtractedMetadata> {
  const pdfjsLib = await import("pdfjs-dist");

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
    .promise;

  const metadata = await pdf.getMetadata();
  const info = metadata.info as Record<string, unknown> | undefined;

  let thumbnailDataUrl: string | null = null;
  try {
    const page = await pdf.getPage(1);
    const scale = 1;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d")!;

    await page.render({ canvasContext: context, viewport, canvas }).promise;
    thumbnailDataUrl = canvas.toDataURL("image/png");
  } catch {
    // Thumbnail rendering failed — continue without it
  }

  return {
    name:
      (typeof info?.Title === "string" && info.Title) ||
      file.name.replace(/\.pdf$/i, ""),
    author: (typeof info?.Author === "string" && info.Author) || null,
    pageCount: pdf.numPages || null,
    thumbnailDataUrl,
  };
}
