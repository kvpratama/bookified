"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, formatDocumentName } from "@/lib/utils";
import { ChatPanel } from "./chat-panel";
import { OutlinePanel } from "./outline-panel";
import type { ChatDocument } from "./types";

const PdfViewer = dynamic(
  () => import("./pdf-viewer").then((mod) => ({ default: mod.PdfViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          <p className="text-sm">Loading viewer…</p>
        </div>
      </div>
    ),
  },
);

export function ChatPageClient({ document: doc }: { document: ChatDocument }) {
  const router = useRouter();
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [outlineVisible, setOutlineVisible] = useState(false);
  const [hasOutline, setHasOutline] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number | undefined>();
  const outlineRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const handlePageSelect = (pageNumber: number) => {
    setSelectedPage(pageNumber);
    // Reset after a brief moment to allow navigation
    setTimeout(() => setSelectedPage(undefined), 100);
  };

  // Close outline when clicking outside
  useEffect(() => {
    if (!outlineVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        outlineRef.current &&
        !outlineRef.current.contains(target) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(target)
      ) {
        setOutlineVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [outlineVisible]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Document header */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-border/40 bg-background/80 backdrop-blur-xl z-20 shrink-0 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0 -ml-2 h-9 w-9 text-muted-foreground hover:text-foreground rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="sr-only">Back</span>
        </Button>
        {hasOutline && (
          <Button
            ref={toggleButtonRef}
            variant="ghost"
            size="icon"
            onClick={() => setOutlineVisible((prev) => !prev)}
            className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground rounded-full"
            aria-label="Toggle outline"
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
        )}
        <div className="min-w-0 flex-1 flex items-center gap-3">
          <div className="p-2 bg-primary/5 rounded-md shrink-0 border border-primary/10">
            <FileText className="w-4 h-4 text-primary opacity-80" />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <h1
              className="font-serif font-medium text-base text-foreground tracking-tight truncate"
              title={doc.name}
            >
              {formatDocumentName(doc.name)}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                {formatBytes(doc.size)}
              </span>
              {doc.page_count && (
                <>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                    {doc.page_count} pages
                  </span>
                </>
              )}
              {doc.author && (
                <>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-[10px] text-muted-foreground font-serif italic truncate max-w-[200px]">
                    {doc.author}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Split-pane content */}
      <div className="flex flex-1 min-h-0 relative bg-muted/30">
        {/* Outline pane */}
        <div ref={outlineRef}>
          <OutlinePanel
            document={doc}
            visible={outlineVisible}
            onOutlineLoad={setHasOutline}
            onPageSelect={handlePageSelect}
          />
        </div>

        {/* PDF viewer */}
        <div
          className={
            chatCollapsed
              ? "flex-1 min-w-0 h-full overflow-hidden transition-all duration-500 ease-in-out"
              : "flex-1 min-w-0 h-full overflow-hidden transition-all duration-500 ease-in-out hidden md:block"
          }
        >
          <PdfViewer document={doc} externalPage={selectedPage} />
        </div>

        {/* Chat panel */}
        <div
          className={
            chatCollapsed
              ? "w-0 transition-all duration-500 ease-in-out border-l-0"
              : "w-full md:w-[380px] lg:w-[420px] shrink-0 h-full transition-all duration-500 ease-in-out border-l border-border/50 shadow-2xl md:shadow-none bg-background absolute md:relative right-0 top-0 bottom-0 z-10"
          }
        >
          <ChatPanel
            document={doc}
            collapsed={chatCollapsed}
            onToggle={() => setChatCollapsed((prev) => !prev)}
          />
        </div>
      </div>
    </div>
  );
}
