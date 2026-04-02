"use server";

import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import type { Citation } from "@/lib/store";

type UpdateResult = {
  data: null;
  error: string | null;
};

export type ChatStreamEvent =
  | { type: "token"; content: string }
  | { type: "citations"; citations: Citation[] }
  | { type: "error"; message: string }
  | { type: "done" };

type StreamChatMessageResult = {
  data: AsyncGenerator<ChatStreamEvent, void, unknown> | null;
  error: string | null;
};

export async function updateDocumentProgress(
  documentId: string,
  currentPage: number,
): Promise<UpdateResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from("documents")
      .update({
        current_page: currentPage,
        last_accessed: new Date().toISOString(),
      } as TablesUpdate<"documents">)
      .eq("id", documentId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to update document progress:", error);
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error updating document progress:", message);
    return { data: null, error: message };
  }
}

export async function streamChatMessage(
  documentId: string,
  message: string,
): Promise<StreamChatMessageResult> {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { data: null, error: "Unauthorized" };
    }

    const endpoint = process.env.BOOKIFIED_API_ENDPOINT;
    if (!endpoint) {
      return { data: null, error: "Ingestion endpoint not configured" };
    }

    const res = await fetch(`${endpoint}/chat/${documentId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      return {
        data: null,
        error: `Chat service unavailable (status ${res.status})`,
      };
    }

    if (!res.body) {
      return { data: null, error: "Invalid response from chat service" };
    }

    return { data: parseSSEStream(res.body), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to stream chat message:", message);
    return { data: null, error: "Failed to connect to chat service" };
  }
}

async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<ChatStreamEvent, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventCount = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      console.log(
        `[SSE Parser] Chunk received, done: ${done}, value length: ${value?.length}`,
      );

      if (done) {
        console.log(
          "[SSE Parser] Stream done, final buffer:",
          JSON.stringify(buffer),
        );
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Normalize line endings (CRLF -> LF) and split by double newline
      const normalized = buffer.replace(/\r\n/g, "\n");
      const messages = normalized.split("\n\n");
      buffer = messages.pop() || "";
      console.log(
        `[SSE Parser] Parsed ${messages.length} complete messages, buffer remaining: ${buffer.length} chars`,
      );

      for (const message of messages) {
        if (!message.trim()) continue;

        const lines = message.split("\n");
        let currentEvent: string | null = null;
        let currentData: string | null = null;

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            currentData = line.slice(6).trim();
          }
        }

        // Process the complete SSE event
        if (currentEvent && currentData) {
          eventCount++;
          console.log(`[SSE Parser] Event #${eventCount}:`, {
            event: currentEvent,
            dataLength: currentData.length,
          });

          if (currentEvent === "token") {
            try {
              // Token data is JSON-encoded string
              const content = JSON.parse(currentData) as string;
              console.log(
                `[SSE Parser] Token #${eventCount}:`,
                JSON.stringify(content),
              );
              yield { type: "token", content };
            } catch (e) {
              console.error(
                "Failed to parse token:",
                e,
                "raw data:",
                currentData,
              );
              // Fallback to raw data if parsing fails
              yield { type: "token", content: currentData };
            }
          } else if (currentEvent === "citations") {
            try {
              const citations = JSON.parse(currentData) as Citation[];
              console.log("[SSE Parser] Citations:", citations.length);
              yield { type: "citations", citations };
            } catch (e) {
              console.error(
                "Failed to parse citations:",
                e,
                "raw data:",
                currentData,
              );
              // Skip malformed citation data
            }
          } else if (currentEvent === "error") {
            try {
              const errorData = JSON.parse(currentData);
              yield {
                type: "error",
                message: errorData.detail || "An error occurred",
              };
            } catch {
              yield { type: "error", message: currentData };
            }
          } else if (currentEvent === "done") {
            yield { type: "done" };
          }
        }
      }
    }
    console.log(
      `[SSE Parser] Stream ended. Total events yielded: ${eventCount}`,
    );
  } finally {
    reader.cancel();
    console.log("[SSE Parser] Reader cancelled");
  }
}
