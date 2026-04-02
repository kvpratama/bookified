"use client";

import { useCallback, useState } from "react";
import {
  streamChatMessage,
  type ChatStreamEvent,
} from "@/app/(dashboard)/chat/[id]/actions";

export type UseChatStreamReturn = {
  sendMessage: (message: string) => Promise<void>;
  isStreaming: boolean;
  error: string | null;
  resetError: () => void;
};

export function useChatStream(
  documentId: string,
  onMessage: (event: ChatStreamEvent) => void,
  onComplete: () => void,
): UseChatStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      console.log("[useChatStream] Starting to send message:", message);
      setIsStreaming(true);
      setError(null);

      const { data: generator, error: actionError } = await streamChatMessage(
        documentId,
        message,
      );

      if (actionError) {
        console.error("[useChatStream] Action error:", actionError);
        setError(actionError);
        setIsStreaming(false);
        return;
      }

      if (!generator) {
        console.error("[useChatStream] No generator returned");
        setError("No response from server");
        setIsStreaming(false);
        return;
      }

      console.log("[useChatStream] Starting to iterate generator");
      let eventCount = 0;
      try {
        for await (const event of generator) {
          eventCount++;
          console.log(`[useChatStream] Event #${eventCount}:`, event);
          onMessage(event);

          if (event.type === "error") {
            console.error(
              "[useChatStream] Received error event:",
              event.message,
            );
            setError(event.message);
            break;
          }

          if (event.type === "done") {
            break;
          }
        }
        console.log(
          `[useChatStream] Generator completed. Total events: ${eventCount}`,
        );
        onComplete();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Stream interrupted";
        console.error("[useChatStream] Stream error:", errorMessage);
        setError(errorMessage);
      } finally {
        console.log("[useChatStream] Setting isStreaming to false");
        setIsStreaming(false);
      }
    },
    [documentId, onMessage, onComplete],
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendMessage,
    isStreaming,
    error,
    resetError,
  };
}
