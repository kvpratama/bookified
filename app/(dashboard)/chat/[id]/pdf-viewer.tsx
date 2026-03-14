"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Document, Page } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "@/lib/pdf-worker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBlobUrl } from "@/lib/utils";
import { useDebouncedCallback } from "@/lib/hooks/use-debounce-callback";
import { useKeyboardNavigation } from "@/lib/hooks/use-keyboard-navigation";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
// ... (imports)
import { updateDocumentProgress } from "./actions";
import type { ChatDocument, OutlineItem } from "./types";

const ZOOM_STEP = 0.15;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const MAX_PAGE_WIDTH = 900;

function clampPage(page: number, totalPages?: number): number {
  const clamped = Math.max(1, page);
  return totalPages && totalPages > 0 ? Math.min(clamped, totalPages) : clamped;
}

export function PdfViewer({
  document: doc,
  externalPage,
  onOutlineExtracted,
  onDocumentLoad,
}: {
  document: ChatDocument;
  externalPage?: number;
  onOutlineExtracted?: (
    outline: OutlineItem[] | null,
    isLoading: boolean,
  ) => void;
  onDocumentLoad?: (pdfDocument: PDFDocumentProxy) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [numPages, setNumPages] = useState<number>(0);

  // Initialize from URL or document
  const getInitialPage = () => {
    const urlPage = searchParams.get("page");
    if (urlPage) {
      const parsed = parseInt(urlPage, 10);
      if (!isNaN(parsed)) return clampPage(parsed);
    }
    return clampPage(doc.current_page || 1);
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage());
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInputValue, setPageInputValue] = useState("");
  const [containerWidth, setContainerWidth] = useState<number | undefined>();
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedSetContainerWidth = useDebouncedCallback<[number]>((width) => {
    setContainerWidth(width);
  }, 400);

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        // Use immediate update for the FIRST load, then debounce
        if (containerWidth === undefined) {
          setContainerWidth(entry.contentRect.width);
        } else {
          debouncedSetContainerWidth(entry.contentRect.width);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerWidth, debouncedSetContainerWidth]);

  const onDocumentLoadSuccess = useCallback(
    async (pdf: PDFDocumentProxy) => {
      setNumPages(pdf.numPages);
      setCurrentPage((p) => clampPage(p, pdf.numPages));
      setIsLoading(false);

      // Pass PDF document instance to parent
      if (onDocumentLoad) {
        onDocumentLoad(pdf);
      }

      // Extract outline
      if (onOutlineExtracted) {
        try {
          const outline = await pdf.getOutline();
          onOutlineExtracted(outline as OutlineItem[] | null, false);
        } catch {
          onOutlineExtracted(null, false);
        }
      }
    },
    [onOutlineExtracted, onDocumentLoad],
  );

  const onDocumentLoadError = useCallback(() => {
    setIsLoading(false);
  }, []);

  const debouncedUpdateProgress = useDebouncedCallback<[number]>(
    async (page: number) => {
      try {
        const { error } = await updateDocumentProgress(
          doc.id,
          page,
          new Date().toISOString(),
        );
        if (error) {
          toast.error("Failed to save reading progress");
        }
      } catch {
        toast.error("Failed to save reading progress");
      }
    },
    1000,
  );

  const updateUrl = useCallback(
    (page: number) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("page", String(page));
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const goToPage = useCallback(
    (page: number) => {
      const newPage = clampPage(page, numPages > 0 ? numPages : undefined);
      setCurrentPage(newPage);
      debouncedUpdateProgress(newPage);
      updateUrl(newPage);
    },
    [numPages, debouncedUpdateProgress, updateUrl],
  );

  // Handle external page navigation
  useEffect(() => {
    if (externalPage && externalPage !== currentPage && numPages > 0) {
      // Use a microtask to avoid synchronous setState lint error
      Promise.resolve().then(() => {
        goToPage(externalPage);
      });
    }
  }, [externalPage, numPages, currentPage, goToPage]);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s + ZOOM_STEP, MAX_SCALE));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(s - ZOOM_STEP, MIN_SCALE));
  }, []);

  const handlePageClick = useCallback(() => {
    setIsEditingPage(true);
    setPageInputValue(String(currentPage));
  }, [currentPage]);

  const handlePageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPageInputValue(e.target.value);
    },
    [],
  );

  const handlePageInputSubmit = useCallback(() => {
    const pageNum = parseInt(pageInputValue, 10);
    if (!isNaN(pageNum)) {
      goToPage(pageNum);
    }
    setIsEditingPage(false);
  }, [pageInputValue, goToPage]);

  const handlePageInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handlePageInputSubmit();
      } else if (e.key === "Escape") {
        setIsEditingPage(false);
      }
    },
    [handlePageInputSubmit],
  );

  const handlePageInputBlur = useCallback(() => {
    setIsEditingPage(false);
  }, []);

  useKeyboardNavigation({
    onLeft: () => goToPage(currentPage - 1),
    onRight: () => goToPage(currentPage + 1),
  });

  const fileUrl = getBlobUrl(doc.blob_url);

  return (
    <div
      className="relative flex flex-col h-full bg-muted/40 group overflow-hidden"
      ref={containerRef}
    >
      {/* PDF content */}
      <ScrollArea className="flex-1" orientation="both">
        <div
          data-testid="pdf-viewer-area"
          className={cn(
            "flex flex-col items-center justify-center py-12 px-6 min-h-full relative",
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
            className="[&_.react-pdf__Page]:w-full! [&_.react-pdf__Page_canvas]:w-full! [&_.react-pdf__Page_canvas]:h-auto!"
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
            <div
              className="transition-all duration-200 ease-in-out"
              style={{
                width: containerWidth ? "100%" : "auto",
                maxWidth: containerWidth
                  ? `${Math.min(containerWidth, MAX_PAGE_WIDTH) * scale}px`
                  : "none",
                height: "auto",
              }}
            >
              <Page
                pageNumber={currentPage}
                width={
                  containerWidth
                    ? Math.min(containerWidth, MAX_PAGE_WIDTH) * scale
                    : undefined
                }
                className="bg-card shadow-2xl ring-1 ring-border rounded-sm overflow-hidden"
                loading={
                  <div
                    className="flex items-center justify-center py-32 bg-card ring-1 ring-border rounded-sm"
                    style={{
                      width: containerWidth
                        ? Math.min(containerWidth, MAX_PAGE_WIDTH)
                        : 600,
                    }}
                  >
                    <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                  </div>
                }
              />
            </div>
          </Document>
        </div>
      </ScrollArea>

      {/* Viewport-fixed Navigation Buttons */}
      {!isLoading && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 h-20 w-10 z-30 rounded-md bg-background/80 hover:bg-background/95 backdrop-blur-sm border border-border/40 shadow-lg text-muted-foreground hover:text-foreground transition-all duration-300",
              "hidden md:inline-flex",
              "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto",
            )}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 h-20 w-10 z-30 rounded-md bg-background/80 hover:bg-background/95 backdrop-blur-sm border border-border/40 shadow-lg text-muted-foreground hover:text-foreground transition-all duration-300",
              "hidden md:inline-flex",
              "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto",
            )}
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </>
      )}

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
            {isEditingPage ? (
              <input
                type="number"
                value={pageInputValue}
                onChange={handlePageInputChange}
                onKeyDown={handlePageInputKeyDown}
                onBlur={handlePageInputBlur}
                autoFocus
                className="text-xs font-semibold tabular-nums w-[80px] text-center bg-transparent border-b border-foreground/20 focus:border-foreground/40 outline-none text-foreground/80 tracking-wide transition-colors"
              />
            ) : (
              <span
                onClick={handlePageClick}
                className="text-xs font-semibold tabular-nums min-w-[80px] text-center select-none text-foreground/80 tracking-wide cursor-pointer hover:text-foreground hover:underline decoration-dotted underline-offset-4 transition-colors"
              >
                {currentPage} / {numPages}
              </span>
            )}
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
