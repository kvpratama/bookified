"use client";

import { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatBytes, formatDocumentName } from "@/lib/utils";
import { ChatPanel } from "./chat-panel";
import {
  DocumentViewerProvider,
  useDocumentViewer,
} from "./document-viewer-context";
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

const OutlinePanel = dynamic(
  () =>
    import("./outline-panel").then((mod) => ({ default: mod.OutlinePanel })),
  { ssr: false },
);

export function ChatPageClient({ document: doc }: { document: ChatDocument }) {
  return (
    <DocumentViewerProvider>
      <ChatPageContent document={doc} />
    </DocumentViewerProvider>
  );
}

function ChatPageContent({ document: doc }: { document: ChatDocument }) {
  const router = useRouter();
  const { state, actions } = useDocumentViewer();
  const outlineRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Close outline when clicking outside
  useEffect(() => {
    if (!state.outlineVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        outlineRef.current &&
        !outlineRef.current.contains(target) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(target)
      ) {
        actions.closeOutline();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [state.outlineVisible, actions]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Document header */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-border/40 bg-background/80 backdrop-blur-xl z-20 shrink-0 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/dashboard");
            }
          }}
          className="shrink-0 -ml-2 h-9 w-9 text-muted-foreground hover:text-foreground rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="sr-only">Back</span>
        </Button>
        {state.hasOutline && (
          <Button
            ref={toggleButtonRef}
            variant="ghost"
            size="icon"
            onClick={actions.toggleOutline}
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
                  <span className="text-[10px] text-muted-foreground/40 select-none">
                    ·
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                    {doc.page_count} pages
                  </span>
                </>
              )}
              {doc.author && (
                <>
                  <span className="text-[10px] text-muted-foreground/40 select-none">
                    ·
                  </span>
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
          <OutlinePanel />
        </div>

        {/* PDF viewer */}
        <div
          className={cn(
            "flex-1 min-w-0 h-full overflow-hidden transition-all duration-400 ease-in-out",
            !state.chatCollapsed && "hidden md:block",
          )}
        >
          <PdfViewer document={doc} />
        </div>

        {/* Chat panel */}
        <div
          className={cn(
            "h-full transition-[width] duration-400 ease-in-out shrink-0 z-10 overflow-hidden",
            state.chatCollapsed
              ? "w-0 border-l-0"
              : "w-full md:w-[400px] border-l border-border/50 shadow-2xl md:shadow-none bg-background absolute md:relative right-0 top-0 bottom-0",
          )}
        >
          <ChatPanel
            document={doc}
            collapsed={state.chatCollapsed}
            onToggle={actions.toggleChat}
          />
        </div>
      </div>
    </div>
  );
}
