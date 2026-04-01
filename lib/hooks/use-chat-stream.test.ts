import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock the server action
const mockStreamChatMessage = vi.hoisted(() => vi.fn());
vi.mock("@/app/(dashboard)/chat/[id]/actions", () => ({
  streamChatMessage: mockStreamChatMessage,
}));

// Mock the store
const mockUpdateMessageContent = vi.hoisted(() => vi.fn());
const mockUpdateMessageCitations = vi.hoisted(() => vi.fn());
const mockAddMessage = vi.hoisted(() => vi.fn());

vi.mock("@/lib/store", () => ({
  useAppStore: vi.fn().mockImplementation((selector) =>
    selector({
      updateMessageContent: mockUpdateMessageContent,
      updateMessageCitations: mockUpdateMessageCitations,
      addMessage: mockAddMessage,
    }),
  ),
}));

import { useChatStream } from "./use-chat-stream";

describe("useChatStream", () => {
  const documentId = "doc-123";
  const onMessage = vi.fn();
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockStreamChatMessage.mockReset();
  });

  it("returns initial state with isStreaming false", () => {
    const { result } = renderHook(() =>
      useChatStream(documentId, onMessage, onComplete),
    );

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.sendMessage).toBeDefined();
  });

  it("calls server action and streams tokens", async () => {
    // Mock generator that yields tokens
    const mockGenerator = async function* () {
      yield { type: "token" as const, content: "Hello " };
      yield { type: "token" as const, content: "world" };
    };

    mockStreamChatMessage.mockResolvedValue({
      data: mockGenerator(),
      error: null,
    });

    const { result } = renderHook(() =>
      useChatStream(documentId, onMessage, onComplete),
    );

    await act(async () => {
      await result.current.sendMessage("Test message");
    });

    // Verify server action was called
    expect(mockStreamChatMessage).toHaveBeenCalledWith(
      documentId,
      "Test message",
    );

    // Verify onMessage was called for each token
    expect(onMessage).toHaveBeenCalledTimes(2);
    expect(onMessage).toHaveBeenCalledWith({
      type: "token",
      content: "Hello ",
    });
    expect(onMessage).toHaveBeenCalledWith({
      type: "token",
      content: "world",
    });

    // Verify streaming state
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("handles citation events", async () => {
    const citations = [{ page: 1, text: "Example quote" }];

    const mockGenerator = async function* () {
      yield { type: "token" as const, content: "Answer" };
      yield { type: "citations" as const, citations };
    };

    mockStreamChatMessage.mockResolvedValue({
      data: mockGenerator(),
      error: null,
    });

    const { result } = renderHook(() =>
      useChatStream(documentId, onMessage, onComplete),
    );

    await act(async () => {
      await result.current.sendMessage("Test message");
    });

    expect(onMessage).toHaveBeenCalledWith({
      type: "citations",
      citations,
    });
  });

  it("sets error state on error events", async () => {
    const mockGenerator = async function* () {
      yield { type: "error" as const, message: "Something went wrong" };
    };

    mockStreamChatMessage.mockResolvedValue({
      data: mockGenerator(),
      error: null,
    });

    const { result } = renderHook(() =>
      useChatStream(documentId, onMessage, onComplete),
    );

    await act(async () => {
      await result.current.sendMessage("Test message");
    });

    expect(result.current.error).toBe("Something went wrong");
    expect(result.current.isStreaming).toBe(false);
  });

  it("sets error state when server action returns error", async () => {
    mockStreamChatMessage.mockResolvedValue({
      data: null,
      error: "Network error",
    });

    const { result } = renderHook(() =>
      useChatStream(documentId, onMessage, onComplete),
    );

    await act(async () => {
      await result.current.sendMessage("Test message");
    });

    expect(result.current.error).toBe("Network error");
  });

  it("calls onComplete when stream finishes", async () => {
    const mockGenerator = async function* () {
      yield { type: "token" as const, content: "Done" };
    };

    mockStreamChatMessage.mockResolvedValue({
      data: mockGenerator(),
      error: null,
    });

    const { result } = renderHook(() =>
      useChatStream(documentId, onMessage, onComplete),
    );

    await act(async () => {
      await result.current.sendMessage("Test message");
    });

    expect(onComplete).toHaveBeenCalled();
  });

  it("resets error when resetError is called", async () => {
    mockStreamChatMessage.mockResolvedValue({
      data: null,
      error: "Network error",
    });

    const { result } = renderHook(() =>
      useChatStream(documentId, onMessage, onComplete),
    );

    await act(async () => {
      await result.current.sendMessage("Test message");
    });

    expect(result.current.error).toBe("Network error");

    await act(async () => {
      result.current.resetError();
    });

    expect(result.current.error).toBeNull();
  });
});
