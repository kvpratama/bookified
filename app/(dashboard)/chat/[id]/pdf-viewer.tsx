"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Document, Page } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "@/lib/pdf-worker";
import { useTheme } from "next-themes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBlobUrl } from "@/lib/utils";
import { useDebouncedCallback } from "@/lib/hooks/use-debounce-callback";
import { useKeyboardNavigation } from "@/lib/hooks/use-keyboard-navigation";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useDocumentViewer } from "./document-viewer-context";
import { updateDocumentProgress } from "./actions";
import type { ChatDocument, OutlineItem } from "./types";

const ZOOM_STEP = 0.15;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const MAX_PAGE_WIDTH = 900;
const PAGE_GAP = 16;
const VIRTUALIZATION_BUFFER = 3; // render this many pages above/below viewport

function clampPage(page: number, totalPages?: number): number {
  const clamped = Math.max(1, page);
  return totalPages && totalPages > 0 ? Math.min(clamped, totalPages) : clamped;
}

export function PdfViewer({ document: doc }: { document: ChatDocument }) {
  const { state: viewerState, actions: viewerActions } = useDocumentViewer();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme } = useTheme();

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
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const pageRefsMap = useRef<Map<number, HTMLDivElement>>(new Map());
  const pageHeightsMap = useRef<Map<number, number>>(new Map());
  const pageRatioMap = useRef<Map<number, number>>(new Map());
  const isScrollingToPage = useRef(false);
  const initialScrollDone = useRef(false);

  const debouncedSetContainerWidth = useDebouncedCallback<[number]>((width) => {
    setContainerWidth(width);
  }, 400);

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
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

      viewerActions.setPdfDocument(pdf);

      try {
        const outline = await pdf.getOutline();
        viewerActions.handleOutlineExtracted(
          outline as OutlineItem[] | null,
          false,
        );
      } catch {
        viewerActions.handleOutlineExtracted(null, false);
      }
    },
    [viewerActions],
  );

  const onDocumentLoadError = useCallback(() => {
    setIsLoading(false);
  }, []);

  const debouncedUpdateProgress = useDebouncedCallback<[number]>(
    async (page: number) => {
      try {
        const { error } = await updateDocumentProgress(doc.id, page);
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

  const debouncedUpdateUrl = useDebouncedCallback<[number]>((page: number) => {
    updateUrl(page);
  }, 500);

  const scrollToPage = useCallback(
    (page: number) => {
      const newPage = clampPage(page, numPages > 0 ? numPages : undefined);
      const el = pageRefsMap.current.get(newPage);
      if (el && scrollViewportRef.current) {
        isScrollingToPage.current = true;
        pageRatioMap.current.clear();
        setCurrentPage(newPage);
        debouncedUpdateProgress(newPage);
        updateUrl(newPage);
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => {
          isScrollingToPage.current = false;
        }, 800);
      }
    },
    [numPages, debouncedUpdateProgress, updateUrl],
  );

  const onDocumentItemClick = useCallback(
    ({ pageNumber }: { pageNumber: number }) => {
      scrollToPage(pageNumber);
    },
    [scrollToPage],
  );

  // Virtualization observer: wide rootMargin to render pages before they scroll into view
  useEffect(() => {
    if (numPages === 0 || !scrollViewportRef.current) return;

    const visibleSet = new Set<number>();

    const observer = new IntersectionObserver(
      (entries) => {
        let changed = false;
        for (const entry of entries) {
          const pageNum = Number(
            (entry.target as HTMLElement).dataset.pageNumber,
          );
          if (entry.isIntersecting) {
            if (!visibleSet.has(pageNum)) {
              visibleSet.add(pageNum);
              changed = true;
            }
          } else {
            if (visibleSet.has(pageNum)) {
              visibleSet.delete(pageNum);
              changed = true;
            }
          }
        }
        if (changed) {
          setVisiblePages(new Set(visibleSet));
        }
      },
      {
        root: scrollViewportRef.current,
        rootMargin: "100% 0px 100% 0px",
        threshold: 0,
      },
    );

    for (const [, el] of pageRefsMap.current) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [numPages]);

  // Current page observer: tight rootMargin to accurately track which page is on screen
  useEffect(() => {
    if (numPages === 0 || !scrollViewportRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingToPage.current) return;

        for (const entry of entries) {
          const pageNum = Number(
            (entry.target as HTMLElement).dataset.pageNumber,
          );
          pageRatioMap.current.set(pageNum, entry.intersectionRatio);
        }

        let bestPage: number | null = null;
        let bestRatio = 0;
        for (const [pageNum, ratio] of pageRatioMap.current) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestPage = pageNum;
          }
        }

        if (bestPage !== null) {
          setCurrentPage(bestPage);
          debouncedUpdateProgress(bestPage);
          debouncedUpdateUrl(bestPage);
        }
      },
      {
        root: scrollViewportRef.current,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const [, el] of pageRefsMap.current) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [numPages, debouncedUpdateProgress, debouncedUpdateUrl]);

  // Notify context of page changes
  useEffect(() => {
    viewerActions.setCurrentPage(currentPage);
  }, [currentPage, viewerActions]);

  // Scroll to initial page after document loads
  useEffect(() => {
    if (numPages === 0 || initialScrollDone.current) return;
    const initialPage = getInitialPage();
    if (initialPage > 1) {
      // Wait for pages to render
      requestAnimationFrame(() => {
        const el = pageRefsMap.current.get(initialPage);
        if (el) {
          isScrollingToPage.current = true;
          el.scrollIntoView({ behavior: "instant", block: "start" });
          setTimeout(() => {
            isScrollingToPage.current = false;
          }, 200);
        }
      });
    }
    initialScrollDone.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages]);

  // Handle external page navigation (from outline panel)
  useEffect(() => {
    if (
      viewerState.selectedPage &&
      viewerState.selectedPage !== currentPage &&
      numPages > 0
    ) {
      Promise.resolve().then(() => {
        scrollToPage(viewerState.selectedPage!);
      });
    }
  }, [viewerState.selectedPage, numPages, currentPage, scrollToPage]);

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
      scrollToPage(pageNum);
    }
    setIsEditingPage(false);
  }, [pageInputValue, scrollToPage]);

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

  const setPageRef = useCallback(
    (pageNumber: number, el: HTMLDivElement | null) => {
      if (el) {
        pageRefsMap.current.set(pageNumber, el);
      } else {
        pageRefsMap.current.delete(pageNumber);
      }
    },
    [],
  );

  // Determine which pages should be rendered (visible + buffer)
  const renderedPageSet = new Set<number>();
  if (visiblePages.size > 0) {
    for (const p of visiblePages) {
      for (
        let i = p - VIRTUALIZATION_BUFFER;
        i <= p + VIRTUALIZATION_BUFFER;
        i++
      ) {
        if (i >= 1 && i <= numPages) renderedPageSet.add(i);
      }
    }
  } else {
    // Before any intersection fires, render around currentPage
    for (
      let i = currentPage - VIRTUALIZATION_BUFFER;
      i <= currentPage + VIRTUALIZATION_BUFFER;
      i++
    ) {
      if (i >= 1 && i <= numPages) renderedPageSet.add(i);
    }
  }

  useKeyboardNavigation({
    onLeft: () => scrollToPage(currentPage - 1),
    onRight: () => scrollToPage(currentPage + 1),
  });

  // Render at max scale to avoid pixelation when zooming in
  // CSS transform scales down for lower zoom levels
  const renderWidth = containerWidth
    ? Math.min(containerWidth, MAX_PAGE_WIDTH) * MAX_SCALE
    : undefined;

  // Fallback estimated height for placeholder pages (letter-size aspect ratio)
  const estimatedPageHeight = renderWidth
    ? (renderWidth / MAX_SCALE) * 1.294
    : 800;

  const fileUrl = getBlobUrl(doc.blob_url);

  return (
    <div
      className="relative flex flex-col h-full bg-muted/40 group overflow-hidden"
      ref={containerRef}
    >
      {/* PDF content */}
      <ScrollArea
        className="flex-1"
        orientation="both"
        viewportRef={scrollViewportRef}
      >
        <div
          data-testid="pdf-viewer-area"
          className={cn(
            "flex flex-col items-center py-8 px-6 min-h-full relative",
            isLoading && "items-center justify-center",
          )}
          style={{ gap: `${PAGE_GAP}px` }}
        >
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 animate-in fade-in duration-500">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground tracking-wide">
                Loading Document…
              </p>
            </div>
          )}

          {/* Wrapper clips overflow and sets visual width for proper centering */}
          <div
            style={{
              width: renderWidth
                ? `${renderWidth * (scale / MAX_SCALE)}px`
                : "auto",
              overflow: "hidden",
            }}
          >
            {/* Scale container via CSS transform for instant zoom without re-rendering */}
            <div
              style={{
                width: renderWidth ? `${renderWidth}px` : "auto",
                transform: `scale(${scale / MAX_SCALE})`,
                transformOrigin: "top left",
              }}
            >
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                onItemClick={onDocumentItemClick}
                loading={null}
                className="flex flex-col items-center [&_.react-pdf__Page]:w-full! [&_.react-pdf__Page_canvas]:w-full! [&_.react-pdf__Page_canvas]:h-auto!"
                error={
                  <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                    <div className="w-14 h-14 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-5">
                      <FileText className="w-6 h-6 text-destructive" />
                    </div>
                    <h3 className="text-lg font-serif text-foreground mb-2 tracking-tight">
                      Unable to Load Document
                    </h3>
                    <p className="text-[13px] text-muted-foreground max-w-[260px] leading-relaxed mb-5">
                      The document could not be rendered. It may be corrupted or
                      temporarily unavailable.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                    >
                      Try again
                    </Button>
                  </div>
                }
              >
                {numPages > 0 &&
                  Array.from({ length: numPages }, (_, i) => i + 1).map(
                    (pageNumber) => {
                      const shouldRender = renderedPageSet.has(pageNumber);
                      const placeholderHeight =
                        pageHeightsMap.current.get(pageNumber) ??
                        estimatedPageHeight;
                      return (
                        <div
                          key={pageNumber}
                          ref={(el) => setPageRef(pageNumber, el)}
                          data-page-number={pageNumber}
                          className={cn(
                            "rounded-sm overflow-hidden",
                            shouldRender && "shadow-2xl bg-white",
                            shouldRender &&
                              theme === "dark" &&
                              "invert hue-rotate-180",
                          )}
                          style={{
                            width: "100%",
                            height: shouldRender
                              ? "auto"
                              : `${placeholderHeight}px`,
                            marginBottom:
                              pageNumber < numPages ? `${PAGE_GAP}px` : 0,
                          }}
                        >
                          {shouldRender && (
                            <Page
                              pageNumber={pageNumber}
                              width={renderWidth}
                              className="overflow-hidden"
                              onRenderSuccess={() => {
                                const el = pageRefsMap.current.get(pageNumber);
                                if (el) {
                                  pageHeightsMap.current.set(
                                    pageNumber,
                                    el.offsetHeight,
                                  );
                                }
                              }}
                              loading={
                                <div
                                  className="flex items-center justify-center"
                                  style={{ height: `${placeholderHeight}px` }}
                                >
                                  <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                                </div>
                              }
                            />
                          )}
                        </div>
                      );
                    },
                  )}
              </Document>
            </div>
          </div>
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
              onClick={() => scrollToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronUp className="w-4 h-4" />
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
              <button
                type="button"
                onClick={handlePageClick}
                aria-label={`Page ${currentPage} of ${numPages}, click to edit`}
                className="text-xs font-semibold tabular-nums min-w-[80px] text-center select-none text-foreground/80 tracking-wide cursor-pointer hover:text-foreground hover:underline decoration-dotted underline-offset-4 transition-colors bg-transparent border-none p-0"
              >
                {currentPage} / {numPages}
              </button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => scrollToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
            >
              <ChevronDown className="w-4 h-4" />
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
