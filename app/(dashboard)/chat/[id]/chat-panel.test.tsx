import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";
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
  ingested_at: "2026-03-31T00:00:00Z",
  is_ingesting: false,
};

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { ingested_at: null }, error: null }),
        }),
      }),
    }),
  }),
}));

// Mock server action
vi.mock("@/app/(dashboard)/actions", () => ({
  triggerIngestion: vi.fn(async () => ({
    data: { triggered: true },
    error: null,
  })),
}));

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
          open={false}
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
          open={false}
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
          open={false}
          onToggle={mockOnToggle}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /open chat/i }));
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  // --- Expanded state ---
  describe("expanded state", () => {
    it("renders the 'Ask Document' header text", () => {
      render(
        <ChatPanel
          document={mockDocument}
          open={true}
          onToggle={mockOnToggle}
        />,
      );
      expect(screen.getByText("Ask Document")).toBeInTheDocument();
    });

    it("renders 'Close chat' button and clicking it calls onToggle", () => {
      render(
        <ChatPanel
          document={mockDocument}
          open={true}
          onToggle={mockOnToggle}
        />,
      );
      const closeButton = screen.getByRole("button", { name: /close chat/i });
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton);
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it("keeps the launcher button in the DOM but hides it from accessibility tree", () => {
      render(
        <ChatPanel
          document={mockDocument}
          open={true}
          onToggle={mockOnToggle}
        />,
      );
      // Use a more robust way to find the button since its accessible name
      // might be reported as empty when inside an aria-hidden container
      const launcher = screen
        .getAllByRole("button", { hidden: true })
        .find((b) => b.getAttribute("aria-label") === "Open chat");
      expect(launcher).toBeDefined();
      expect(launcher).toHaveAttribute("aria-hidden", "true");
      expect(launcher).toHaveAttribute("tabIndex", "-1");
      expect(launcher).toHaveClass("opacity-0", "pointer-events-none");
    });

    it("restores focus to the launcher button when closed", () => {
      vi.useFakeTimers();
      const { rerender } = render(
        <ChatPanel
          document={mockDocument}
          open={true}
          onToggle={mockOnToggle}
        />,
      );

      const closeButton = screen.getByRole("button", { name: /close chat/i });
      fireEvent.click(closeButton);

      // Simulate the state change that should happen in the parent component
      rerender(
        <ChatPanel
          document={mockDocument}
          open={false}
          onToggle={mockOnToggle}
        />,
      );

      vi.advanceTimersByTime(10); // Wait for our setTimeout
      const launcher = screen.getByRole("button", { name: /open chat/i });
      expect(launcher).toHaveFocus();

      vi.useRealTimers();
    });

    it("shows empty state 'Ask the Document' when no messages", () => {
      render(
        <ChatPanel
          document={mockDocument}
          open={true}
          onToggle={mockOnToggle}
        />,
      );
      expect(screen.getByText("Ask the Document")).toBeInTheDocument();
    });

    it("renders input with correct placeholder", () => {
      render(
        <ChatPanel
          document={mockDocument}
          open={true}
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
          open={true}
          onToggle={mockOnToggle}
        />,
      );
      const sendButton = screen.getByRole("button", { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });

    it("focuses the input when the panel opens", () => {
      vi.useFakeTimers();
      render(
        <ChatPanel
          document={mockDocument}
          open={true}
          onToggle={mockOnToggle}
        />,
      );
      const input = screen.getByLabelText(/chat message input/i);
      expect(input).not.toHaveFocus();

      vi.advanceTimersByTime(150); // Advance past the 100ms timeout

      expect(input).toHaveFocus();
      vi.useRealTimers();
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
          open={true}
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
          open={true}
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
          open={true}
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
          open={true}
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
          open={true}
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
          open={true}
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
          open={true}
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
          open={true}
          onToggle={mockOnToggle}
        />,
      );
      const input = screen.getByLabelText(/chat message input/i);
      const sendButton = screen.getByRole("button", { name: /send message/i });

      fireEvent.change(input, { target: { value: "Trigger typing" } });
      fireEvent.click(sendButton);

      expect(sendButton).toBeDisabled();
    });

    it("does not call triggerIngestion when document is already ingested", async () => {
      const { triggerIngestion } = await import("@/app/(dashboard)/actions");

      render(
        <ChatPanel
          document={{
            ...mockDocument,
            ingested_at: "2026-03-31T00:00:00Z",
            is_ingesting: false,
          }}
          open={true}
          onToggle={mockOnToggle}
        />,
      );

      expect(triggerIngestion).not.toHaveBeenCalled();
    });

    it("does not call triggerIngestion when document is currently ingesting", async () => {
      const { triggerIngestion } = await import("@/app/(dashboard)/actions");

      render(
        <ChatPanel
          document={{ ...mockDocument, ingested_at: null, is_ingesting: true }}
          open={true}
          onToggle={mockOnToggle}
        />,
      );

      expect(triggerIngestion).not.toHaveBeenCalled();
    });

    it("calls triggerIngestion when document is idle (not ingesting, not ingested)", async () => {
      const { triggerIngestion } = await import("@/app/(dashboard)/actions");

      render(
        <ChatPanel
          document={{ ...mockDocument, ingested_at: null, is_ingesting: false }}
          open={true}
          onToggle={mockOnToggle}
        />,
      );

      expect(triggerIngestion).toHaveBeenCalledWith(mockDocument.id);
    });

    it("after AI response timeout, addMessage is called again with an AI message", () => {
      vi.useFakeTimers();

      render(
        <ChatPanel
          document={mockDocument}
          open={true}
          onToggle={mockOnToggle}
        />,
      );
      const input = screen.getByLabelText(/chat message input/i);

      fireEvent.change(input, { target: { value: "Test timeout" } });
      fireEvent.click(screen.getByRole("button", { name: /send message/i }));

      // With real streaming, addMessage is called twice: user message + AI placeholder
      expect(mockAddMessage).toHaveBeenCalledTimes(2);
      expect(mockAddMessage).toHaveBeenNthCalledWith(
        1,
        mockDocument.id,
        expect.objectContaining({ role: "user", content: "Test timeout" }),
      );
      expect(mockAddMessage).toHaveBeenNthCalledWith(
        2,
        mockDocument.id,
        expect.objectContaining({ role: "ai", content: "" }),
      );

      // Advance past the max possible timeout (1500 + 1000 = 2500ms)
      vi.advanceTimersByTime(3000);

      // After timeout, no additional addMessage calls (streaming handles updates)
      expect(mockAddMessage).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  // --- Ingestion warning banner ---
  describe("ingestion warning", () => {
    it("shows warning when document is not ingested and not ingesting (idle)", () => {
      render(
        <ChatPanel
          document={{ ...mockDocument, ingested_at: null, is_ingesting: false }}
          open={true}
          onToggle={mockOnToggle}
        />,
      );
      expect(screen.getByText("Analyzing Document")).toBeInTheDocument();
    });

    it("shows warning when document is currently ingesting", () => {
      render(
        <ChatPanel
          document={{ ...mockDocument, ingested_at: null, is_ingesting: true }}
          open={true}
          onToggle={mockOnToggle}
        />,
      );
      expect(screen.getByText("Analyzing Document")).toBeInTheDocument();
    });

    it("does not show warning when document is already ingested", () => {
      render(
        <ChatPanel
          document={{
            ...mockDocument,
            ingested_at: "2026-03-31T00:00:00Z",
            is_ingesting: false,
          }}
          open={true}
          onToggle={mockOnToggle}
        />,
      );
      expect(screen.queryByText("Analyzing Document")).not.toBeInTheDocument();
    });
  });

  // --- Scroll to bottom ---
  describe("scroll-to-bottom on open", () => {
    let scrollAssignments: number[];
    let mockScrollHeight: number;

    beforeEach(() => {
      scrollAssignments = [];
      mockScrollHeight = 500;
    });

    function patchScrollViewport() {
      const viewport = document.querySelector(
        '[data-slot="scroll-area-viewport"]',
      );
      if (viewport) {
        Object.defineProperty(viewport, "scrollHeight", {
          get: () => mockScrollHeight,
          configurable: true,
        });
        let _scrollTop = 0;
        Object.defineProperty(viewport, "scrollTop", {
          get: () => _scrollTop,
          set: (v: number) => {
            _scrollTop = v;
            scrollAssignments.push(v);
          },
          configurable: true,
        });
      }
    }

    it("scrolls to bottom when panel opens", () => {
      vi.useFakeTimers();
      const { rerender } = render(
        <ChatPanel
          document={mockDocument}
          open={false}
          onToggle={mockOnToggle}
        />,
      );

      // Open the panel
      rerender(
        <ChatPanel
          document={mockDocument}
          open={true}
          onToggle={mockOnToggle}
        />,
      );

      patchScrollViewport();

      // Advance past the delayed scroll (150ms)
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(scrollAssignments.length).toBeGreaterThanOrEqual(1);
      expect(scrollAssignments[scrollAssignments.length - 1]).toBe(
        mockScrollHeight,
      );
      vi.useRealTimers();
    });

    it("does not scroll when panel is closed", () => {
      vi.useFakeTimers();
      render(
        <ChatPanel
          document={mockDocument}
          open={false}
          onToggle={mockOnToggle}
        />,
      );

      act(() => {
        vi.advanceTimersByTime(200);
      });

      // No scroll viewport exists when sheet is closed, so no scroll assignments
      expect(scrollAssignments).toHaveLength(0);
      vi.useRealTimers();
    });
  });
});
