"use client";

import { Document, Outline } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "@/lib/pdf-worker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getBlobUrl } from "@/lib/utils";
import type { ChatDocument } from "./types";
import "./outline-panel.css";

interface OutlinePanelProps {
  document: ChatDocument;
  onPageSelect: (pageNumber: number) => void;
  visible: boolean;
  onOutlineLoad: (hasOutline: boolean) => void;
}

export function OutlinePanel({
  document,
  visible,
  onOutlineLoad,
  onPageSelect,
}: OutlinePanelProps) {
  const handleLoadSuccess = (outline: unknown) => {
    onOutlineLoad(!!outline);
  };

  const handleLoadError = () => {
    onOutlineLoad(false);
  };

  const handleItemClick = ({ pageNumber }: { pageNumber: number }) => {
    onPageSelect(pageNumber);
  };

  const fileUrl = getBlobUrl(document.blob_url);

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
          <Document file={fileUrl} loading={null}>
            <Outline
              onLoadSuccess={handleLoadSuccess}
              onLoadError={handleLoadError}
              onItemClick={handleItemClick}
            />
          </Document>
        </div>
      </ScrollArea>
    </div>
  );
}
