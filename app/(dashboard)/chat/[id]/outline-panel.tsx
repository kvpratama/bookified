"use client";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "@/lib/pdf-worker";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { OutlineItem } from "./types";
import "./outline-panel.css";

interface OutlinePanelProps {
  outline: OutlineItem[] | null;
  onPageSelect: (pageNumber: number) => void;
  visible: boolean;
  isLoading: boolean;
  pdfDocument?: PDFDocumentProxy | null;
}

export function OutlinePanel({
  outline,
  visible,
  isLoading,
  onPageSelect,
  pdfDocument,
}: OutlinePanelProps) {
  const handleItemClick = async (dest: unknown) => {
    if (!pdfDocument || !dest) return;

    try {
      // dest can be a string (named destination) or array [ref, ...]
      let pageIndex: number;

      if (Array.isArray(dest) && dest[0]) {
        // dest is [ref, ...] - get page index from ref
        pageIndex = await pdfDocument.getPageIndex(dest[0]);
      } else {
        // Fallback to page 1 if we can't resolve
        pageIndex = 0;
      }

      // Page numbers are 1-indexed for users
      onPageSelect(pageIndex + 1);
    } catch {
      // If resolution fails, just go to page 1
      onPageSelect(1);
    }
  };

  const renderOutlineItems = (items: OutlineItem[]) => {
    return items.map((item, index) => (
      <div key={index}>
        <button
          onClick={() => handleItemClick(item.dest)}
          className="text-left w-full py-1 px-2 hover:bg-muted/50 rounded text-sm"
        >
          {item.title}
        </button>
        {item.items && item.items.length > 0 && (
          <div className="ml-3">{renderOutlineItems(item.items)}</div>
        )}
      </div>
    ));
  };

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
            <div className="text-sm text-muted-foreground">
              Loading outline...
            </div>
          )}
          {!isLoading && outline && renderOutlineItems(outline)}
        </div>
      </ScrollArea>
    </div>
  );
}
