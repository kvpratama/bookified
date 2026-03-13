"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, formatDocumentName } from "@/lib/utils";
import { ChatPanel } from "./chat-panel";
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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Document header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/50 backdrop-blur-sm shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0 -ml-2 h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <div className="p-1.5 bg-muted rounded shrink-0">
            <FileText className="w-4 h-4 text-accent-foreground" />
          </div>
          <div className="min-w-0">
            <h1
              className="font-serif font-medium text-sm text-foreground truncate"
              title={doc.name}
            >
              {formatDocumentName(doc.name)}
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {formatBytes(doc.size)}
              {doc.page_count ? ` · ${doc.page_count} pages` : ""}
              {doc.author ? ` · ${doc.author}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Split-pane content */}
      <div className="flex flex-1 min-h-0">
        {/* Left pane — PDF viewer */}
        <div
          className={
            chatCollapsed
              ? "flex-1 min-w-0 h-full overflow-hidden"
              : "w-3/4 min-w-0 h-full overflow-hidden hidden md:block"
          }
        >
          <PdfViewer document={doc} />
        </div>

        {/* Right pane — Chat */}
        <div
          className={
            chatCollapsed
              ? ""
              : "w-full md:w-1/4 min-w-[280px] max-w-md h-full overflow-hidden"
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
