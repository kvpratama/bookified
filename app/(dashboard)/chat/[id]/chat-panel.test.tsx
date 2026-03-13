import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ChatPanel } from "./chat-panel";
import type { ChatMessage } from "@/lib/store";
import type { ChatDocument } from "./types";

const mockAddMessage = vi.hoisted(() => vi.fn());
const mockChats = vi.hoisted(() => ({
  current: {} as Record<string, ChatMessage[]>,
}));

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    chats: mockChats.current,
    addMessage: mockAddMessage,
  }),
}));

const mockDocument: ChatDocument = {
  id: "doc-1",
  name: "Test_Document.pdf",
  author: "Jane Doe",
  page_count: 10,
  size: 2500000,
  blob_url: "https://example.com/test.pdf",
  current_page: 3,
};

describe("ChatPanel", () => {
  let mockOnToggle: () => void;

  beforeEach(() => {
    mockOnToggle = vi.fn();
    mockAddMessage.mockClear();
    mockChats.current = {};
  });

  afterEach(() => {
    cleanup();
  });

  // --- Collapsed state ---
  describe("collapsed state", () => {
    it("renders 'Open chat' button when collapsed", () => {
      render(
        <ChatPanel
          document={mockDocument}
          collapsed={true}
          onToggle={mockOnToggle}
        />,
      );
      expect(
        screen.getByRole("button", { name: /open chat/i }),
      ).toBeInTheDocument();
    });

    it("does NOT render the chat input when collapsed", () => {
      render(
        <ChatPanel
          document={mockDocument}
          collapsed={true}
          onToggle={mockOnToggle}
        />,
      );
      expect(
        screen.queryByLabelText(/chat message input/i),
      ).not.toBeInTheDocument();
    });

    it("calls onToggle when 'Open chat' button is clicked", () => {
      render(
        <ChatPanel
          document={mockDocument}
          collapsed={true}
          onToggle={mockOnToggle}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /open chat/i }));
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  // --- Expanded state ---
  describe("expanded state", () => {
    it("renders the 'Chat' header text", () => {
      render(
        <ChatPanel
          document={mockDocument}
          collapsed={false}
          onToggle={mockOnToggle}
        />,
      );
      expect(screen.getByText("Chat")).toBeInTheDocument();
    });

    it("renders 'Close chat' button and clicking it calls onToggle", () => {
      render(
        <ChatPanel
          document={mockDocument}
          collapsed={false}
          onToggle={mockOnToggle}
        />,
      );
      const closeButton = screen.getByRole("button", { name: /close chat/i });
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton);
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it("shows empty state 'Chat with Document' when no messages", () => {
      render(
        <ChatPanel
          document={mockDocument}
          collapsed={false}
          onToggle={mockOnToggle}
        />,
      );
      expect(screen.getByText("Chat with Document")).toBeInTheDocument();
    });

    it("renders input with correct placeholder", () => {
      render(
        <ChatPanel
          document={mockDocument}
          collapsed={false}
          onToggle={mockOnToggle}
        />,
      );
      expect(
        screen.getByPlaceholderText("Ask about this document…"),
      ).toBeInTheDocument();
    });

    it("send button is disabled when input is empty", () => {
      render(
        <ChatPanel
          document={mockDocument}
          collapsed={false}
          onToggle={mockOnToggle}
        />,
      );
      const sendButton = screen.getByRole("button", { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });
  });

  // --- With messages ---
  describe("with messages", () => {
    const existingMessages: ChatMessage[] = [
      {
        id: "msg-1",
        role: "user",
        content: "What is this document about?",
        timestamp: "2026-03-10T10:00:00Z",
      },
      {
        id: "msg-2",
        role: "ai",
        content: "This document covers testing best practices.",
        timestamp: "2026-03-10T10:01:00Z",
      },
    ];

    beforeEach(() => {
      mockChats.current = { [mockDocument.id]: existingMessages };
    });

    it("renders existing messages from the store", () => {
      render(
        <ChatPanel
          document={mockDocument}
          collapsed={false}
          onToggle={mockOnToggle}
        />,
      );
      expect(
        screen.getByText("What is this document about?"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("This document covers testing best practices."),
      ).toBeInTheDocument();
    });

    it("user messages show correct content", () => {
      render(
        <ChatPanel
          document={mockDocument}
          collapsed={false}
          onToggle={mockOnToggle}
        />,
      );
      expect(
        screen.getByText("What is this document about?"),
      ).toBeInTheDocument();
    });

    it("AI messages show correct content", () => {
      render(
        <ChatPanel
          document={mockDocument}
          collapsed={false}
          onToggle={mockOnToggle}
        />,
      );
      expect(
        screen.getByText("This document covers testing best practices."),
      ).toBeInTheDocument();
    });
  });

  // --- Sending messages ---
  describe("sending messages", () => {
    it("typing in input and clicking send calls addMessage with correct args", () => {
      render(
        <ChatPanel
          document={mockDocument}
          collapsed={false}
          onToggle={mockOnToggle}
        />,
      );
      const input = screen.getByLabelText(/chat message input/i);
      const sendButton = screen.getByRole("button", { name: /send message/i });

      fireEvent.change(input, { target: { value: "Hello AI" } });
      fireEvent.click(sendButton);

      expect(mockAddMessage).toHaveBeenCalledWith(
        mockDocument.id,
        expect.objectContaining({
          role: "user",
          content: "Hello AI",
        }),
      );
    });

    it("input is cleared after sending", () => {
      render(
        <ChatPanel
          document={mockDocument}
          collapsed={false}
          onToggle={mockOnToggle}
        />,
      );
      const input = screen.getByLabelText(/chat message input/i);

      fireEvent.change(input, { target: { value: "Hello AI" } });
      fireEvent.click(screen.getByRole("button", { name: /send message/i }));

      expect(input).toHaveValue("");
    });

    it("pressing Enter sends the message", () => {
      render(
        <ChatPanel
          document={mockDocument}
          collapsed={false}
          onToggle={mockOnToggle}
        />,
      );
      const input = screen.getByLabelText(/chat message input/i);

      fireEvent.change(input, { target: { value: "Enter message" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockAddMessage).toHaveBeenCalledWith(
        mockDocument.id,
        expect.objectContaining({
          role: "user",
          content: "Enter message",
        }),
      );
    });

    it("pressing Shift+Enter does NOT send the message", () => {
      render(
        <ChatPanel
          document={mockDocument}
          collapsed={false}
          onToggle={mockOnToggle}
        />,
      );
      const input = screen.getByLabelText(/chat message input/i);

      fireEvent.change(input, { target: { value: "No send" } });
      fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

      expect(mockAddMessage).not.toHaveBeenCalled();
    });

    it("send button is disabled during typing/loading state", () => {
      render(
        <ChatPanel
          document={mockDocument}
          collapsed={false}
          onToggle={mockOnToggle}
        />,
      );
      const input = screen.getByLabelText(/chat message input/i);
      const sendButton = screen.getByRole("button", { name: /send message/i });

      fireEvent.change(input, { target: { value: "Trigger typing" } });
      fireEvent.click(sendButton);

      expect(sendButton).toBeDisabled();
    });

    it("after AI response timeout, addMessage is called again with an AI message", () => {
      vi.useFakeTimers();

      render(
        <ChatPanel
          document={mockDocument}
          collapsed={false}
          onToggle={mockOnToggle}
        />,
      );
      const input = screen.getByLabelText(/chat message input/i);

      fireEvent.change(input, { target: { value: "Test timeout" } });
      fireEvent.click(screen.getByRole("button", { name: /send message/i }));

      expect(mockAddMessage).toHaveBeenCalledTimes(1);
      expect(mockAddMessage).toHaveBeenCalledWith(
        mockDocument.id,
        expect.objectContaining({ role: "user", content: "Test timeout" }),
      );

      // Advance past the max possible timeout (1500 + 1000 = 2500ms)
      vi.advanceTimersByTime(3000);

      expect(mockAddMessage).toHaveBeenCalledTimes(2);
      expect(mockAddMessage).toHaveBeenLastCalledWith(
        mockDocument.id,
        expect.objectContaining({ role: "ai" }),
      );

      vi.useRealTimers();
    });
  });
});
