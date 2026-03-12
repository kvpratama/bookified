"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";
import { upload } from "@vercel/blob/client";
import { MetadataForm } from "./metadata-form";
import { extractPdfMetadata } from "./pdf-utils";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { saveDocumentAction, deleteBlobsAction } from "./actions";
import type { ExtractedMetadata, UploadMetadata } from "./upload-schema";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type UploadStatus =
  | "idle"
  | "extracting"
  | "metadata"
  | "uploading"
  | "success";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [extractedMetadata, setExtractedMetadata] =
    useState<ExtractedMetadata | null>(null);

  const extractMetadata = useCallback(async (selectedFile: File) => {
    setUploadStatus("extracting");
    setError(null);

    try {
      const metadata = await extractPdfMetadata(selectedFile);
      setExtractedMetadata(metadata);
      setUploadStatus("metadata");
    } catch {
      setError("Failed to process PDF. Please try again.");
      setUploadStatus("idle");
    }
  }, []);

  const validateAndSetFile = useCallback(
    (selectedFile: File) => {
      setError(null);
      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError("File size exceeds the 10MB limit.");
        return;
      }
      setFile(selectedFile);
      extractMetadata(selectedFile);
    },
    [extractMetadata],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        validateAndSetFile(e.dataTransfer.files[0]);
      }
    },
    [validateAndSetFile],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleMetadataSubmit = async (data: UploadMetadata) => {
    if (!file) return;

    setUploadStatus("uploading");

    try {
      // 0. Get user for path construction
      const supabase = createSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Unauthorized. Please log in.");
        setUploadStatus("metadata");
        return;
      }

      const docFolder = `${user.id}/${file.name.replace(/\.pdf$/i, "")}`;
      const pdfPath = `${docFolder}/${file.name}`;
      const thumbName = file.name.replace(/\.pdf$/i, ".png");
      const thumbPath = `${docFolder}/${thumbName}`;

      // 1. Prepare parallel uploads
      type BlobResponse = { url: string };
      const uploadPromises: [
        Promise<BlobResponse>,
        Promise<BlobResponse | undefined>,
      ] = [
        upload(pdfPath, file, {
          access: "private",
          handleUploadUrl: "/api/upload",
        }),
        extractedMetadata?.thumbnailDataUrl
          ? (async () => {
              const res = await fetch(extractedMetadata.thumbnailDataUrl!);
              const blob = await res.blob();
              const thumbFile = new File([blob], thumbName, {
                type: "image/png",
              });
              return upload(thumbPath, thumbFile, {
                access: "private",
                handleUploadUrl: "/api/upload",
              });
            })()
          : Promise.resolve(undefined),
      ];

      // 2. Execute parallel uploads
      const [pdfBlob, thumbBlob] = await Promise.all(uploadPromises);

      // 3. Save to database via Server Action
      const result = await saveDocumentAction({
        name: data.name,
        author: data.author,
        pageCount: data.pageCount,
        blobUrl: pdfBlob.url,
        thumbnailUrl: thumbBlob?.url,
        size: file.size,
      });

      if (result.error) {
        const blobUrls = [pdfBlob.url, thumbBlob?.url].filter(Boolean);
        await deleteBlobsAction(blobUrls as string[]).catch(() => {});
        toast.error(result.error || "Failed to save document");
        setUploadStatus("metadata");
        return;
      }

      setUploadStatus("success");
      toast.success("Document uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload document. Please try again.");
      setUploadStatus("metadata");
    }
  };

  const resetState = () => {
    setUploadStatus("idle");
    setFile(null);
    setError(null);
    setExtractedMetadata(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 max-w-2xl mx-auto w-full overflow-hidden">
      <div className="text-center mb-10 animate-fade-in relative z-10">
        <h1 className="text-4xl font-serif tracking-tight text-foreground sm:text-5xl">
          Upload Document
        </h1>
        <p className="text-muted-foreground mt-4 max-w-md mx-auto text-lg leading-relaxed">
          Upload a document to your library
        </p>
      </div>

      <Card className="w-full border-border/40 bg-card/60 animate-slide-up relative z-10 overflow-hidden ring-1 ring-border/50">
        <CardContent className="p-8">
          {(uploadStatus === "idle" || uploadStatus === "extracting") && (
            <div
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-xl transition-all duration-500 ease-in-out group",
                uploadStatus === "extracting"
                  ? "border-primary/40 bg-muted/30 pointer-events-none"
                  : dragActive
                    ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                    : "border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-muted/30",
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
              role="button"
              tabIndex={0}
              aria-label="Upload PDF file"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onButtonClick();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleChange}
              />

              {uploadStatus === "extracting" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl z-10">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    Analyzing Document...
                  </p>
                </div>
              )}

              <div className="flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 mb-6 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                  <UploadCloud className="w-8 h-8 text-primary" />
                </div>
                <p className="mb-2 text-lg font-medium text-foreground">
                  {dragActive ? (
                    "Drop your file here"
                  ) : (
                    <>
                      <span className="font-semibold underline decoration-primary/30 underline-offset-4">
                        Click to upload a file
                      </span>{" "}
                      or drag and drop
                    </>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">PDF · Max 10MB</p>
              </div>

              <div className="mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    onButtonClick();
                  }}
                  className="rounded-full px-8 border-primary/20 hover:bg-primary/5 transition-colors"
                >
                  Browse Files
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-center gap-3 p-4 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl animate-shake">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {(uploadStatus === "metadata" || uploadStatus === "uploading") &&
            extractedMetadata && (
              <div className="animate-fade-in">
                <MetadataForm
                  metadata={extractedMetadata}
                  isSubmitting={uploadStatus === "uploading"}
                  onSubmit={handleMetadataSubmit}
                  onCancel={resetState}
                />
              </div>
            )}

          {uploadStatus === "success" && file && (
            <div className="space-y-8 py-6 animate-fade-in">
              <div className="flex flex-col items-center text-center pb-2">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 animate-scale-in">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-serif text-foreground">
                  Upload Complete
                </h3>
                <p className="text-muted-foreground mt-2">
                  Your document is ready in the library.
                </p>
              </div>

              <div className="flex items-center gap-5 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="p-3 bg-primary/20 rounded-lg shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-6 border-t border-border/40">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full rounded-xl py-6 text-sm font-medium shadow-lg shadow-primary/20"
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={resetState}
                  className="w-full rounded-xl py-6 text-muted-foreground hover:text-foreground"
                >
                  Upload another file
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
