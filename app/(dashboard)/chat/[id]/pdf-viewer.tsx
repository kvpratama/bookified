"use client";

import { useState, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBlobUrl } from "@/lib/utils";
import { useDebouncedCallback } from "@/lib/hooks/use-debounce-callback";
import { updateDocumentProgress } from "./actions";
import type { ChatDocument } from "./types";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const ZOOM_STEP = 0.15;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;

export function PdfViewer({ document: doc }: { document: ChatDocument }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(doc.current_page || 1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: total }: { numPages: number }) => {
      setNumPages(total);
      setIsLoading(false);
    },
    [],
  );

  const onDocumentLoadError = useCallback(() => {
    setIsLoading(false);
  }, []);

  const debouncedUpdateProgress = useDebouncedCallback<[number]>(
    (page: number) => {
      updateDocumentProgress(doc.id, page, new Date().toISOString());
    },
    1000,
  );

  const goToPage = useCallback(
    (page: number) => {
      const newPage = Math.max(1, Math.min(page, numPages));
      setCurrentPage(newPage);
      debouncedUpdateProgress(newPage);
    },
    [numPages, debouncedUpdateProgress],
  );

  useEffect(() => {
    updateDocumentProgress(doc.id, currentPage, new Date().toISOString());
  }, [doc.id, currentPage]);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s + ZOOM_STEP, MAX_SCALE));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(s - ZOOM_STEP, MIN_SCALE));
  }, []);

  const fileUrl = getBlobUrl(doc.blob_url);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 shrink-0">
        {/* Page navigation */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <span className="text-xs text-muted-foreground font-medium tabular-nums min-w-[5rem] text-center select-none">
            {isLoading ? (
              "Loading…"
            ) : (
              <>
                Page {currentPage} of {numPages}
              </>
            )}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
          >
            <ChevronRight className="w-4 h-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
          >
            <ZoomOut className="w-3.5 h-3.5" />
            <span className="sr-only">Zoom out</span>
          </Button>
          <span className="text-xs text-muted-foreground font-medium tabular-nums min-w-[3rem] text-center select-none">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span className="sr-only">Zoom in</span>
          </Button>
        </div>
      </div>

      {/* PDF content */}
      <ScrollArea className="flex-1">
        <div
          className={cn(
            "flex flex-col items-center py-6 px-4 gap-4 min-h-full",
            isLoading && "items-center justify-center",
          )}
        >
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Loading document…</p>
            </div>
          )}

          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            error={
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm text-destructive font-medium">
                  Failed to load PDF
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  The document could not be rendered. Please try again later.
                </p>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              className="shadow-lg rounded border border-border/50 overflow-hidden [&_canvas]:!w-full [&_canvas]:!h-auto"
              loading={
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                </div>
              }
            />
          </Document>
        </div>
      </ScrollArea>
    </div>
  );
}
