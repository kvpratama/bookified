"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "@/lib/pdf-worker";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDocumentViewer } from "./document-viewer-context";
import type { OutlineItem } from "./types";
import "./outline-panel.css";

/** Resolve a dest (string name or explicit array) to a 1-based page number. */
async function resolveDestToPage(
  dest: unknown,
  pdfDocument: PDFDocumentProxy,
): Promise<number | null> {
  let resolved = dest;

  if (typeof resolved === "string") {
    resolved = await pdfDocument.getDestination(resolved);
  }

  if (Array.isArray(resolved) && resolved[0]) {
    const pageIndex = await pdfDocument.getPageIndex(resolved[0]);
    return pageIndex + 1;
  }

  return null;
}

async function resolveOutlinePages(
  items: OutlineItem[],
  pdfDocument: PDFDocumentProxy,
): Promise<Map<OutlineItem, number>> {
  const map = new Map<OutlineItem, number>();

  async function walk(list: OutlineItem[]) {
    for (const item of list) {
      if (item.dest) {
        try {
          const page = await resolveDestToPage(item.dest, pdfDocument);
          if (page !== null) {
            map.set(item, page);
          }
        } catch {
          // skip unresolvable
        }
      }
      if (item.items && item.items.length > 0) {
        await walk(item.items);
      }
    }
  }

  await walk(items);
  return map;
}

/** Given a flat map of item→page and the current page, find the active item.
 *  The active item is the last one whose page ≤ currentPage. */
function findActiveItem(
  pageMap: Map<OutlineItem, number>,
  currentPage: number,
): OutlineItem | null {
  let activeItem: OutlineItem | null = null;
  let activePage = 0;

  for (const [item, page] of pageMap) {
    if (page <= currentPage && page >= activePage) {
      activePage = page;
      activeItem = item;
    }
  }

  return activeItem;
}

export function OutlinePanel() {
  const { state, actions } = useDocumentViewer();
  const {
    outline,
    outlineVisible: visible,
    isOutlineLoading: isLoading,
    pdfDocument,
    currentPage,
  } = state;
  const { handlePageSelect: onPageSelect } = actions;
  const [pageMap, setPageMap] = useState<Map<OutlineItem, number>>(new Map());
  const activeRef = useRef<HTMLButtonElement>(null);
  const [, startTransition] = useTransition();

  // Resolve all outline destinations to page numbers once (non-blocking)
  useEffect(() => {
    if (!outline || !pdfDocument) return;

    let cancelled = false;
    resolveOutlinePages(outline, pdfDocument).then((map) => {
      if (!cancelled) {
        startTransition(() => {
          setPageMap(map);
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [outline, pdfDocument]);

  // Derive active item during render — no effect needed
  const activeItem =
    pageMap.size > 0 ? findActiveItem(pageMap, currentPage) : null;

  // Scroll the active item into view within the panel
  useEffect(() => {
    if (activeRef.current && visible) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeItem, visible]);

  const handleItemClick = useCallback(
    async (dest: unknown) => {
      if (!pdfDocument || !dest) return;

      try {
        const page = await resolveDestToPage(dest, pdfDocument);
        onPageSelect(page ?? 1);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(
          `Failed to navigate to outline page, returning to page 1: ${message}`,
        );
        onPageSelect(1);
      }
    },
    [pdfDocument, onPageSelect],
  );

  const renderOutlineItems = (items: OutlineItem[], depth = 0) => {
    return items.map((item, index) => {
      const isActive = item === activeItem;

      return (
        <div
          key={`${depth}-${index}-${item.title}`}
          className="outline-item-enter"
          style={{ animationDelay: `${(depth * items.length + index) * 40}ms` }}
        >
          <button
            ref={isActive ? activeRef : undefined}
            onClick={() => handleItemClick(item.dest)}
            className={cn("outline-item-btn", depth === 0 && "font-medium")}
          >
            {isActive && <span>→ </span>}
            {item.title}
          </button>
          {item.items && item.items.length > 0 && (
            <div className="outline-nested">
              {renderOutlineItems(item.items, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const hasOutline = outline && outline.length > 0;

  return (
    <div
      data-testid="outline-panel"
      className={cn(
        "h-full border-r border-border/40 bg-card transition-all duration-400 ease-in-out overflow-hidden",
        visible ? "w-[250px]" : "w-0",
      )}
    >
      <div className="px-5 py-4 border-b border-border/30">
        <h2 className="text-xs font-serif font-medium text-foreground/70 uppercase tracking-[0.15em]">
          Contents
        </h2>
      </div>
      <ScrollArea className="h-[calc(100%-57px)]">
        <div className="px-3 py-4 outline-panel-content">
          {isLoading && (
            <div className="space-y-3 px-2" role="status">
              <span className="sr-only">Loading outline...</span>
              {[72, 55, 85, 40, 65].map((width, i) => (
                <div
                  key={i}
                  className="outline-skeleton-bar"
                  style={{
                    width: `${width}%`,
                    animationDelay: `${i * 150}ms`,
                  }}
                />
              ))}
            </div>
          )}
          {!isLoading && hasOutline && renderOutlineItems(outline)}
          {!isLoading && !hasOutline && (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/60">
              <BookOpen className="size-8 mb-3 opacity-40" strokeWidth={1.2} />
              <p className="text-xs font-serif italic tracking-wide">
                No contents available
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
