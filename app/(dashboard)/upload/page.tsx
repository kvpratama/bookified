"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, formatBytes } from "@/lib/utils";
import { MetadataForm } from "./metadata-form";
import { extractPdfMetadata } from "./pdf-utils";
import { uploadDocumentAction } from "./actions";
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

    const formData = new FormData();
    formData.append("file", file);
    formData.append("metadata", JSON.stringify(data));
    if (extractedMetadata?.thumbnailDataUrl) {
      formData.append("thumbnail", extractedMetadata.thumbnailDataUrl);
    }

    try {
      const result = await uploadDocumentAction(formData);

      if (result.error) {
        toast.error(result.error || "Failed to upload document");
        setUploadStatus("metadata");
        return;
      }

      setUploadStatus("success");
      toast.success("Document uploaded successfully!");
    } catch {
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 max-w-2xl mx-auto w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif tracking-tight text-foreground">
          Upload Document
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload a PDF to begin your intelligent reading session.
        </p>
      </div>

      <Card className="w-full shadow-sm border-border">
        <CardContent className="p-6">
          {uploadStatus === "idle" && (
            <div
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg transition-colors duration-200 ease-in-out hover:border-primary",
                dragActive
                  ? "border-primary bg-muted/50"
                  : "border-border bg-muted/30 hover:bg-muted/50",
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
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                <UploadCloud className="w-10 h-10 mb-4 text-muted-foreground/60" />
                <p className="mb-2 text-sm font-medium">
                  <span className="font-semibold text-foreground">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-xs">PDF up to 10MB</p>
              </div>
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onButtonClick();
                }}
                className="absolute bottom-6 mx-auto"
              >
                Select File
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {uploadStatus === "extracting" && file && (
            <div className="space-y-6 py-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-muted rounded-lg shrink-0">
                  <FileText className="w-6 h-6 text-primary/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              <div className="space-y-2" role="status" aria-live="polite">
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>Processing PDF...</span>
                </div>
                <Progress value={undefined} className="h-2" />
              </div>
            </div>
          )}

          {uploadStatus === "metadata" && extractedMetadata && (
            <MetadataForm
              metadata={extractedMetadata}
              isSubmitting={false}
              onSubmit={handleMetadataSubmit}
              onCancel={resetState}
            />
          )}

          {uploadStatus === "uploading" && extractedMetadata && (
            <MetadataForm
              metadata={extractedMetadata}
              isSubmitting={true}
              onSubmit={handleMetadataSubmit}
              onCancel={resetState}
            />
          )}

          {uploadStatus === "success" && file && (
            <div className="space-y-6 py-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-muted rounded-lg shrink-0">
                  <FileText className="w-6 h-6 text-primary/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatBytes(file.size)}
                  </p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
                <Button variant="ghost" onClick={resetState} className="w-full">
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
