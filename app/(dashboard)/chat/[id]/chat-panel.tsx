"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Send, Sparkles, MessageSquare, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { useAppStore, type ChatMessage } from "@/lib/store";
import type { ChatDocument } from "./types";
import { cn } from "@/lib/utils";
import { triggerIngestion } from "@/app/(dashboard)/actions";
import { useChatStream } from "@/lib/hooks/use-chat-stream";
import type { ChatStreamEvent } from "@/app/(dashboard)/chat/[id]/actions";
import { CitationList } from "./citation-list";
import { useDocumentViewer } from "./document-viewer-context";

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

function generateId() {
  return Math.random().toString(36).substring(7);
}

export function ChatPanel({
  document: doc,
  open,
  onToggle,
}: {
  document: ChatDocument;
  open: boolean;
  onToggle: () => void;
}) {
  const { actions: viewerActions } = useDocumentViewer();
  const [inputValue, setInputValue] = useState("");
  const [currentAiMessageId, setCurrentAiMessageId] = useState<string | null>(
    null,
  );
  const [eventQueue, setEventQueue] = useState<ChatStreamEvent[]>([]);
  const processedIndexRef = useRef(0);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const { chats, addMessage, updateMessageContent, updateMessageCitations } =
    useAppStore();
  const currentChat = useMemo(() => chats[doc.id] || [], [chats, doc.id]);
  const isIngested = !!doc.ingested_at;

  // Process queued events - only process new events since last render
  useEffect(() => {
    if (eventQueue.length === 0 || !currentAiMessageId) return;
    if (processedIndexRef.current >= eventQueue.length) return;

    console.log(
      `[ChatPanel] Processing events ${processedIndexRef.current} -> ${eventQueue.length}`,
    );

    for (let i = processedIndexRef.current; i < eventQueue.length; i++) {
      const event = eventQueue[i];
      if (event.type === "token") {
        console.log(
          `[ChatPanel] Updating content with token:`,
          JSON.stringify(event.content),
        );
        updateMessageContent(doc.id, currentAiMessageId, event.content);
      } else if (event.type === "citations") {
        console.log(`[ChatPanel] Updating citations:`, event.citations.length);
        updateMessageCitations(doc.id, currentAiMessageId, event.citations);
      }
    }

    processedIndexRef.current = eventQueue.length;
  }, [
    eventQueue,
    currentAiMessageId,
    doc.id,
    updateMessageContent,
    updateMessageCitations,
  ]);

  // Handle streaming events - queue them for processing in useEffect
  const handleStreamEvent = useCallback((event: ChatStreamEvent) => {
    console.log(`[ChatPanel] Queuing event:`, event.type);
    setEventQueue((prev) => {
      const newQueue = [...prev, event];
      console.log(
        `[ChatPanel] Queue size: ${prev.length} -> ${newQueue.length}`,
      );
      return newQueue;
    });
  }, []);

  const handleStreamComplete = useCallback(() => {
    console.log(
      `[ChatPanel] Stream complete, current queue length:`,
      eventQueue.length,
    );
    // Don't clear currentAiMessageId here - let the useEffect finish processing
    // The ID will be cleared on next message or when component unmounts
  }, [eventQueue.length]);

  const { sendMessage, isStreaming, error, resetError } = useChatStream(
    doc.id,
    handleStreamEvent,
    handleStreamComplete,
  );

  // Clear error when panel closes
  useEffect(() => {
    if (!open && error) {
      resetError();
    }
  }, [open, error, resetError]);

  // Trigger ingestion when the panel opens and document is idle
  useEffect(() => {
    if (!open || isIngested || doc.is_ingesting) return;

    triggerIngestion(doc.id);
  }, [open, isIngested, doc.is_ingesting, doc.id]);

  // Scroll to bottom on new message or when opening the panel
  useEffect(() => {
    if (!open) return;

    const scrollToBottom = () => {
      if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTop =
          scrollViewportRef.current.scrollHeight;
      }
    };

    // Immediate scroll for new messages while panel is already open
    scrollToBottom();
    // Delayed scroll to handle Sheet open animation rendering
    const timer = setTimeout(scrollToBottom, 150);
    return () => clearTimeout(timer);
  }, [currentChat, isStreaming, open]);

  // Focus input when the panel opens
  useEffect(() => {
    if (open) {
      // Small timeout to allow the sheet portal/animation to render
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMsg = inputValue.trim();
    setInputValue("");
    inputRef.current?.focus();

    // Reset processed index for new message
    processedIndexRef.current = 0;
    setEventQueue([]);

    // Add user message immediately
    addMessage(doc.id, {
      id: generateId(),
      role: "user",
      content: userMsg,
      timestamp: new Date().toISOString(),
    });

    // Create placeholder for AI response with accumulated content
    const aiMessageId = generateId();
    setCurrentAiMessageId(aiMessageId);
    addMessage(doc.id, {
      id: aiMessageId,
      role: "ai",
      content: "",
      timestamp: new Date().toISOString(),
      citations: [],
    });

    // Start streaming
    await sendMessage(userMsg);
  }, [inputValue, isStreaming, doc.id, addMessage, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  const fab = (
    <Button
      ref={launcherRef}
      onClick={onToggle}
      aria-label="Open chat"
      aria-hidden={open}
      tabIndex={open ? -1 : 0}
      size="icon"
      className={cn(
        "fixed right-6 bottom-24 md:bottom-6 z-50 h-14 w-14 rounded-full shadow-2xl transition-all duration-500 ease-in-out hover:scale-105",
        open && "opacity-0 pointer-events-none",
      )}
    >
      <MessageSquare className="w-6 h-6" />
    </Button>
  );

  return (
    <>
      {fab}
      <Sheet
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onToggle();
            setTimeout(() => launcherRef.current?.focus(), 0);
          }
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:max-w-[400px] md:max-w-[600px] p-0 gap-0"
        >
          <SheetTitle className="sr-only">Chat</SheetTitle>
          <div className="flex flex-col h-full bg-background/50 relative">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-background/95 backdrop-blur-xl shrink-0 z-10 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-primary shrink-0 opacity-80" />
                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground/80 truncate">
                  Ask Document
                </span>
              </div>
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close chat"
                  className="rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </SheetClose>
            </div>

            {/* Ingestion warning */}
            {!isIngested && (
              <div className="px-4 py-3 bg-accent border-b border-border/40 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                <AlertCircle className="w-4 h-4 text-accent-foreground mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1">
                  <p className="text-[12px] font-medium text-foreground leading-none">
                    Analyzing Document
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
                    Chat is available but answers may be inaccurate while the
                    ingestion process is running.
                  </p>
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea
              className="flex-1 px-4 py-6"
              viewportRef={scrollViewportRef}
            >
              <div className="space-y-8 flex flex-col pb-4">
                {currentChat.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center mx-auto max-w-[260px] animate-in fade-in duration-700 relative">
                    {/* Warm radial glow */}
                    <div className="absolute inset-0 -top-10 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-accent-foreground/4 blur-3xl" />
                      <div className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full bg-primary/3 blur-2xl" />
                    </div>
                    <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-accent-foreground/10 to-primary/5 border border-accent-foreground/10 flex items-center justify-center mb-6 shadow-sm">
                      <Sparkles className="w-6 h-6 text-accent-foreground animate-breathe" />
                    </div>
                    <h3 className="relative text-xl font-serif text-foreground mb-3 tracking-tight">
                      Ask the Document
                    </h3>
                    <p className="relative text-[13px] text-muted-foreground leading-relaxed">
                      Extract key insights, summarize chapters, or find specific
                      references within this volume.
                    </p>
                  </div>
                ) : (
                  currentChat.map((msg: ChatMessage) => (
                    <div key={msg.id}>
                      {/* System/Error Message */}
                      {msg.role === "system" ? (
                        <div className="flex items-center justify-center py-3 px-4 bg-destructive/10 border border-destructive/20 rounded-lg my-2">
                          <AlertCircle className="w-4 h-4 text-destructive mr-2 shrink-0" />
                          <p className="text-sm text-destructive font-medium">
                            {msg.content}
                          </p>
                        </div>
                      ) : msg.role === "user" ? (
                        /* User Message */
                        <Message from="user" className="max-w-[92%]">
                          <MessageContent className="rounded-2xl rounded-tr-sm shadow-sm">
                            {msg.content}
                          </MessageContent>
                          <span className="text-[10px] text-muted-foreground/60 font-medium select-none tracking-wide mt-1 self-end mr-1">
                            {formatTime(msg.timestamp)}
                          </span>
                        </Message>
                      ) : (
                        /* AI Message */
                        <Message from="assistant" className="max-w-[92%]">
                          <MessageContent className="p-0 gap-0 min-w-[280px]">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 shrink-0">
                                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm text-primary">
                                  <Sparkles className="w-3.5 h-3.5" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                {msg.content ? (
                                  <>
                                    <MessageResponse className="font-serif text-[15.5px] leading-relaxed text-foreground">
                                      {msg.content}
                                    </MessageResponse>
                                    <CitationList
                                      citations={msg.citations || []}
                                      onCitationClick={(page) =>
                                        viewerActions.handlePageSelect(page)
                                      }
                                    />
                                  </>
                                ) : (
                                  <div className="py-1">
                                    <div className="flex gap-1.5 items-center h-[20px]">
                                      <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                      <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                      <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </MessageContent>
                          <span className="text-[10px] text-muted-foreground/60 font-medium select-none tracking-wide mt-1 ml-12">
                            {formatTime(msg.timestamp)}
                          </span>
                        </Message>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 bg-background/95 backdrop-blur-xl border-t border-border/40 shrink-0 relative z-20 shadow-sm">
              <div className="relative flex items-center overflow-hidden shadow-sm rounded-full bg-muted/30 border border-border/50 transition-all focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/30 focus-within:bg-background focus-within:shadow-md">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about this document…"
                  aria-label="Chat message input"
                  className="pr-14 pl-5 py-6 text-[14px] bg-transparent dark:bg-transparent border-none focus-visible:ring-0 shadow-none font-sans rounded-full"
                />
                <Button
                  size="icon"
                  className="absolute right-1.5 w-9 h-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-sm disabled:opacity-50"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isStreaming}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground/60 mt-3 font-medium select-none tracking-wide uppercase">
                AI can make mistakes. Verify important info.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
