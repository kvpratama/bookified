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
    <div className="relative flex flex-col h-full bg-[#E5E5E5]/40 dark:bg-black/20">
      {/* PDF content */}
      <ScrollArea className="flex-1">
        <div
          className={cn(
            "flex flex-col items-center justify-center py-12 px-6 min-h-full",
            isLoading && "items-center justify-center",
          )}
        >
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 animate-in fade-in duration-500">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground tracking-wide">
                Loading Document…
              </p>
            </div>
          )}

          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            error={
              <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
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
              className="bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] ring-1 ring-black/5 dark:ring-white/10 rounded-sm overflow-hidden [&_canvas]:w-full! [&_canvas]:h-auto! transition-transform duration-200"
              loading={
                <div className="flex items-center justify-center py-32 min-w-[600px] bg-white ring-1 ring-black/5 rounded-sm">
                  <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                </div>
              }
            />
          </Document>
        </div>
      </ScrollArea>

      {/* Floating Toolbar */}
      {!isLoading && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6 px-5 py-2.5 bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-full animate-in slide-in-from-bottom-5 fade-in duration-500">
          {/* Page navigation */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <span className="text-xs font-semibold tabular-nums min-w-[80px] text-center select-none text-foreground/80 tracking-wide">
              {currentPage} / {numPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
            >
              <ChevronRight className="w-4 h-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>

          <div className="w-px h-4 bg-border" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              onClick={zoomOut}
              disabled={scale <= MIN_SCALE}
            >
              <ZoomOut className="w-4 h-4" />
              <span className="sr-only">Zoom out</span>
            </Button>
            <span className="text-xs font-semibold tabular-nums min-w-[50px] text-center select-none text-foreground/80 tracking-wide">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              onClick={zoomIn}
              disabled={scale >= MAX_SCALE}
            >
              <ZoomIn className="w-4 h-4" />
              <span className="sr-only">Zoom in</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
