"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppStore, PdfDocument } from "@/lib/store";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadPage() {
  const router = useRouter();
  const addDocument = useAppStore((state) => state.addDocument);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success"
  >("idle");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const simulateUpload = useCallback(
    (selectedFile: File) => {
      setUploadStatus("uploading");
      setUploadProgress(0);

      const uploadTime = 2000; // 2 seconds
      const intervalTime = 100;
      const steps = uploadTime / intervalTime;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const progress = Math.min(Math.round((currentStep / steps) * 100), 100);
        setUploadProgress(progress);

        if (currentStep >= steps) {
          clearInterval(interval);
          setUploadStatus("success");

          // Add to store
          const newDoc: PdfDocument = {
            id: Math.random().toString(36).substring(7),
            name: selectedFile.name,
            size: selectedFile.size,
            uploadDate: new Date().toISOString(),
          };
          addDocument(newDoc);
        }
      }, intervalTime);
    },
    [addDocument],
  );

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
      simulateUpload(selectedFile);
    },
    [simulateUpload],
  );

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

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
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
              className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg transition-colors duration-200 ease-in-out ${
                dragActive
                  ? "border-primary bg-muted/50"
                  : "border-border bg-muted/30 hover:bg-muted/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
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
                onClick={onButtonClick}
                className="absolute bottom-6 mx-auto"
              >
                Select File
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md dark:bg-red-950/50 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {(uploadStatus === "uploading" || uploadStatus === "success") &&
            file && (
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
                  {uploadStatus === "success" && (
                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                  )}
                </div>

                {uploadStatus === "uploading" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {uploadStatus === "success" && (
                  <div className="flex flex-col gap-3 pt-4 border-t border-border">
                    <Button
                      onClick={() => router.push("/dashboard")}
                      className="w-full"
                    >
                      Go to Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setUploadStatus("idle");
                        setFile(null);
                        setUploadProgress(0);
                      }}
                      className="w-full"
                    >
                      Upload another file
                    </Button>
                  </div>
                )}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
