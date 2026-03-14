"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Send, Sparkles, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import type { ChatMessage } from "@/lib/store";
import type { ChatDocument } from "./types";
import { cn } from "@/lib/utils";

export function ChatPanel({
  document: doc,
  collapsed,
  onToggle,
}: {
  document: ChatDocument;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { chats, addMessage } = useAppStore();
  const currentChat = useMemo(() => chats[doc.id] || [], [chats, doc.id]);

  // Scroll to bottom on new message or when opening the panel
  useEffect(() => {
    if (!collapsed && scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop =
        scrollViewportRef.current.scrollHeight;
    }
  }, [currentChat, isTyping, collapsed]);

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isTyping) return;

    const userMsg = inputValue.trim();
    setInputValue("");
    inputRef.current?.focus();

    addMessage(doc.id, {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: userMsg,
      timestamp: new Date().toISOString(),
    });

    setIsTyping(true);

    setTimeout(
      () => {
        setIsTyping(false);

        const docName = doc.name.replace(/\.pdf$/i, "").replace(/_/g, " ");
        const aiResponses = [
          `Based on "${docName}", the key takeaway regarding your question is...`,
          `Looking at page 3 of "${docName}", I can confirm that...`,
          `That's an interesting point. The document suggests a different approach...`,
          `According to the data presented in this PDF, we can conclude that...`,
        ];

        const randomResponse =
          aiResponses[Math.floor(Math.random() * aiResponses.length)];

        addMessage(doc.id, {
          id: Math.random().toString(36).substring(7),
          role: "ai",
          content: `${randomResponse} Is there a specific section you'd like me to analyze further?`,
          timestamp: new Date().toISOString(),
        });

        // Refocus input after AI response
        inputRef.current?.focus();
      },
      1500 + Math.random() * 1000,
    );
  }, [inputValue, isTyping, doc.id, doc.name, addMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Collapsed state — show floating button
  if (collapsed) {
    return (
      <Button
        onClick={onToggle}
        size="icon"
        className="fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full shadow-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105"
        aria-label="Open chat"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background/50",
        collapsed && "hidden",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-background/95 backdrop-blur-xl shrink-0 z-10 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)]">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-primary shrink-0 opacity-80" />
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground/80 truncate">
            Ask Document
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground shrink-0 transition-colors"
          onClick={onToggle}
          aria-label="Close chat"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-6" viewportRef={scrollViewportRef}>
        <div className="space-y-8 flex flex-col pb-4">
          {currentChat.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center mx-auto max-w-[260px] animate-in fade-in duration-700">
              <div className="w-14 h-14 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mb-6 shadow-sm">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-serif text-foreground mb-3 tracking-tight">
                Ask the Document
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Extract key insights, summarize chapters, or find specific
                references within this volume.
              </p>
            </div>
          ) : (
            currentChat.map((msg: ChatMessage) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-4 max-w-[92%] animate-in fade-in slide-in-from-bottom-2 duration-500",
                  msg.role === "user"
                    ? "self-end flex-row-reverse"
                    : "self-start",
                )}
              >
                {msg.role !== "user" && (
                  <div className="mt-1 shrink-0">
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm text-primary">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    "flex flex-col gap-1.5 min-w-0",
                    msg.role === "user" ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "text-[14px]",
                      msg.role === "user"
                        ? "bg-foreground text-background px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm font-sans font-medium"
                        : "text-foreground relative pl-5 py-1 border-l-[3px] border-primary/20 font-serif text-[15.5px] leading-relaxed",
                    )}
                  >
                    {msg.content}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] text-muted-foreground/60 font-medium select-none tracking-wide",
                      msg.role !== "user" && "ml-5",
                    )}
                  >
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex gap-4 max-w-[92%] self-start animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="mt-1 shrink-0">
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="pl-5 py-2 border-l-[3px] border-primary/20 flex gap-1.5 items-center h-[36px]">
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 bg-background/95 backdrop-blur-xl border-t border-border/40 shrink-0 relative z-20 shadow-[0_-1px_3px_0_rgb(0,0,0,0.02)]">
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
            disabled={!inputValue.trim() || isTyping}
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
  );
}
