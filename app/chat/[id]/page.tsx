"use client";

import { useState, useRef, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Sparkles, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppStore, ChatMessage } from "@/lib/store";

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { documents, chats, addMessage } = useAppStore();
  const pdfId = resolvedParams.id;

  const currentPdf = documents.find((doc) => doc.id === pdfId);
  const currentChat = useMemo(() => chats[pdfId] || [], [chats, pdfId]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentChat, isTyping]);

  if (!currentPdf) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center p-4">
        <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Document not found
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          The PDF you are trying to chat with doesn&apos;t exist or was removed.
        </p>
        <Button onClick={() => router.push("/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (!inputValue.trim() || isTyping) return;

    const userMsg = inputValue.trim();
    setInputValue("");

    // Add user message
    addMessage(pdfId, {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: userMsg,
      timestamp: new Date().toISOString(),
    });

    // Simulate AI response delay
    setIsTyping(true);

    setTimeout(
      () => {
        setIsTyping(false);

        const aiResponses = [
          `Based on "${currentPdf.name}", the key takeaway regarding your question is...`,
          `Looking at page 3 of "${currentPdf.name}", I can confirm that...`,
          `That's an interesting point. The document suggests a different approach...`,
          `According to the data presented in this PDF, we can conclude that...`,
        ];

        const randomResponse =
          aiResponses[Math.floor(Math.random() * aiResponses.length)];

        addMessage(pdfId, {
          id: Math.random().toString(36).substring(7),
          role: "ai",
          content: `${randomResponse} Is there a specific section you'd like me to analyze further?`,
          timestamp: new Date().toISOString(),
        });
      },
      1500 + Math.random() * 1000,
    ); // 1.5 to 2.5 seconds delay
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto w-full bg-white dark:bg-zinc-950 border-x border-zinc-200 dark:border-zinc-800 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard")}
          className="shrink-0 -ml-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <div className="p-1.5 bg-muted rounded mr-1 shrink-0">
            <FileText className="w-4 h-4 text-primary/70" />
          </div>
          <div className="min-w-0">
            <h1
              className="font-serif font-medium text-[15px] text-foreground truncate"
              title={currentPdf.name}
            >
              {currentPdf.name.replace(".pdf", "").replace(/_/g, " ")}
            </h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
              {formatBytes(currentPdf.size)} • {currentPdf.pageCount || 0} pages
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 flex flex-col pb-4">
          {currentChat.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center mx-auto max-w-sm">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-serif text-foreground">
                Chat with Document
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Ask questions to summarize, extract data, or find key insights
                from this volume.
              </p>
            </div>
          ) : (
            currentChat.map((msg: ChatMessage) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}
              >
                <Avatar className="w-8 h-8 shrink-0 mt-1 border border-zinc-200 dark:border-zinc-800">
                  {msg.role === "user" ? (
                    <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900">
                      <Sparkles className="w-4 h-4" />
                    </AvatarFallback>
                  )}
                </Avatar>

                <div
                  className={`flex flex-col gap-1 min-w-0 ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-[15px] shadow-sm leading-relaxed [word-break:break-word] ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm border border-border/50"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 px-1 font-medium select-none">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex gap-3 max-w-[85%] self-start">
              <Avatar className="w-8 h-8 shrink-0 mt-1 border border-zinc-200 dark:border-zinc-800">
                <AvatarFallback className="bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900">
                  <Sparkles className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl rounded-tl-sm px-4 py-3.5 flex gap-1 items-center h-[42px]">
                <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 mt-auto shrink-0">
        <div className="relative flex items-end gap-2 max-w-3xl mx-auto">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this document..."
            className="pr-12 py-6 text-[15px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 shadow-sm"
            disabled={isTyping}
          />
          <Button
            size="icon"
            className="absolute right-1.5 top-1.5 h-auto py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-sm"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
          >
            <Send className="w-4 h-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
        <p className="text-center text-[10px] text-zinc-400 mt-2.5 font-medium select-none">
          AI can make mistakes. Consider verifying important information.
        </p>
      </div>
    </div>
  );
}

// Utility helper for file size formatting
const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
