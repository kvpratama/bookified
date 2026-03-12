import { z } from "zod";

export const uploadMetadataSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  author: z.string().optional(),
  pageCount: z.coerce.number().int().positive().optional(),
});

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>;

export const saveDocumentSchema = uploadMetadataSchema.extend({
  blobUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  size: z.number().min(0),
});

export interface ExtractedMetadata {
  name: string;
  author: string | null;
  pageCount: number | null;
  thumbnailDataUrl: string | null;
}
