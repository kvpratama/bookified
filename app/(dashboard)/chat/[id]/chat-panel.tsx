"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Send, Sparkles, User, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const { chats, addMessage } = useAppStore();
  const currentChat = useMemo(() => chats[doc.id] || [], [chats, doc.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentChat, isTyping]);

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isTyping) return;

    const userMsg = inputValue.trim();
    setInputValue("");

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
        className="fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
        aria-label="Open chat"
      >
        <MessageSquare className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <div className="flex flex-col h-full border-l border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-accent-foreground shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground truncate">
            Chat
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
          onClick={onToggle}
          aria-label="Close chat"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4 flex flex-col pb-2">
          {currentChat.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center mx-auto max-w-[200px]">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-serif text-foreground">
                Chat with Document
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Ask questions to summarize or find key insights from this
                volume.
              </p>
            </div>
          ) : (
            currentChat.map((msg: ChatMessage) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2 max-w-[95%]",
                  msg.role === "user"
                    ? "self-end flex-row-reverse"
                    : "self-start",
                )}
              >
                <Avatar className="w-6 h-6 shrink-0 mt-0.5 border border-border">
                  {msg.role === "user" ? (
                    <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                      <User className="w-3 h-3" />
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                      <Sparkles className="w-3 h-3" />
                    </AvatarFallback>
                  )}
                </Avatar>

                <div
                  className={cn(
                    "flex flex-col gap-0.5 min-w-0",
                    msg.role === "user" ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "px-3 py-2 rounded-2xl text-[13px] leading-relaxed [word-break:break-word]",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm border border-border/50",
                    )}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-muted-foreground px-1 font-medium select-none">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex gap-2 max-w-[95%] self-start">
              <Avatar className="w-6 h-6 shrink-0 mt-0.5 border border-border">
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                  <Sparkles className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2.5 flex gap-1 items-center h-[34px]">
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-2.5 bg-background border-t border-border shrink-0">
        <div className="relative flex items-end gap-1.5">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this document…"
            aria-label="Chat message input"
            className="pr-10 py-5 text-[13px] bg-muted border-border focus-visible:ring-1 focus-visible:ring-ring"
            disabled={isTyping}
          />
          <Button
            size="icon"
            className="absolute right-1 top-1 h-auto py-1.5 px-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
          >
            <Send className="w-3.5 h-3.5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
        <p className="text-center text-[9px] text-muted-foreground mt-2 font-medium select-none">
          AI can make mistakes. Consider verifying important information.
        </p>
      </div>
    </div>
  );
}
