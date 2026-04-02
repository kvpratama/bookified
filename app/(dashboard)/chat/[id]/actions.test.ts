import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// Use a shared object for session/user data that's reset in beforeEach
const mockContext = {
  data: { is_ingesting: false, ingested_at: null } as unknown,
  error: null as unknown,
  session: { access_token: "token-123" } as unknown,
  user: { id: "user-1" } as unknown,
};

// Stable mock references
const mockSingle = vi.fn().mockImplementation(async () => ({
  data: mockContext.data,
  error: mockContext.error,
}));
const mockEq: unknown = vi.fn();
(mockEq as Mock).mockImplementation(() => ({
  single: mockSingle,
  eq: mockEq,
}));

const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

const mockFrom = vi.fn().mockImplementation(() => ({
  select: mockSelect,
  update: mockUpdate,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: mockFrom,
    auth: {
      getUser: vi
        .fn()
        .mockImplementation(async () => ({ data: { user: mockContext.user } })),
      getSession: vi.fn().mockImplementation(async () => ({
        data: { session: mockContext.session },
      })),
    },
  })),
}));

import { updateDocumentProgress } from "./actions";

describe("updateDocumentProgress", () => {
  const documentId = "doc-123";
  const currentPage = 42;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext.error = null;
    mockContext.user = { id: "user-1" };
  });

  it("calls supabase with the correct arguments", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-13T10:00:00Z"));

    await updateDocumentProgress(documentId, currentPage);

    expect(mockFrom).toHaveBeenCalledWith("documents");
    expect(mockUpdate).toHaveBeenCalledWith({
      current_page: currentPage,
      last_accessed: "2026-03-13T10:00:00.000Z",
    });
    expect(mockEq).toHaveBeenCalledWith("id", documentId);
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");

    vi.useRealTimers();
  });
});

describe("streamChatMessage", () => {
  const documentId = "doc-123";
  const message = "What is the main argument?";

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext.error = null;
    mockContext.session = { access_token: "token-123" };
    vi.stubEnv("BOOKIFIED_API_ENDPOINT", "https://api.example.com");
  });

  it("returns error when no session", async () => {
    mockContext.session = null as unknown;

    const { streamChatMessage } = await import("./actions");
    const result = await streamChatMessage(documentId, message);

    expect(result.error).toBe("Unauthorized");
    expect(result.data).toBeNull();
  });

  it("returns error when endpoint not configured", async () => {
    vi.unstubAllEnvs();

    const { streamChatMessage } = await import("./actions");
    const result = await streamChatMessage(documentId, message);

    expect(result.error).toBe("Ingestion endpoint not configured");
    expect(result.data).toBeNull();
  });

  it("returns error on network failure", async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { streamChatMessage } = await import("./actions");
    const result = await streamChatMessage(documentId, message);

    expect(result.error).toBe("Failed to connect to chat service");
    expect(result.data).toBeNull();

    global.fetch = originalFetch;
  });

  it("returns error on HTTP error status", async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { streamChatMessage } = await import("./actions");
    const result = await streamChatMessage(documentId, message);

    expect(result.error).toBe("Chat service unavailable (status 500)");
    expect(result.data).toBeNull();

    global.fetch = originalFetch;
  });

  it("yields token events correctly", async () => {
    const mockSSE = `data: "Hello"\nevent: token\n\n`;
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(mockSSE),
            })
            .mockResolvedValueOnce({ done: true, value: undefined }),
          cancel: vi.fn(),
        }),
      },
    });

    const { streamChatMessage } = await import("./actions");
    const result = await streamChatMessage(documentId, message);

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();

    if (result.data) {
      const events = [];
      for await (const event of result.data) {
        events.push(event);
      }
      expect(events).toContainEqual({ type: "token", content: "Hello" });
    }

    global.fetch = originalFetch;
  });

  it("yields citation events correctly", async () => {
    const citations = [{ page: 1, text: "Example quote" }];
    const mockSSE = `data: ${JSON.stringify(citations)}\nevent: citations\n\n`;
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(mockSSE),
            })
            .mockResolvedValueOnce({ done: true, value: undefined }),
          cancel: vi.fn(),
        }),
      },
    });

    const { streamChatMessage } = await import("./actions");
    const result = await streamChatMessage(documentId, message);

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();

    if (result.data) {
      const events = [];
      for await (const event of result.data) {
        events.push(event);
      }
      expect(events).toContainEqual({
        type: "citations",
        citations: citations,
      });
    }

    global.fetch = originalFetch;
  });

  it("yields error events correctly", async () => {
    const mockSSE = `data: {"detail": "Something went wrong"}\nevent: error\n\n`;
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(mockSSE),
            })
            .mockResolvedValueOnce({ done: true, value: undefined }),
          cancel: vi.fn(),
        }),
      },
    });

    const { streamChatMessage } = await import("./actions");
    const result = await streamChatMessage(documentId, message);

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();

    if (result.data) {
      const events = [];
      for await (const event of result.data) {
        events.push(event);
      }
      expect(events).toContainEqual({
        type: "error",
        message: "Something went wrong",
      });
    }

    global.fetch = originalFetch;
  });

  it("yields done event to signal completion", async () => {
    const mockSSE = `event: done\ndata: {}\n\n`;
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(mockSSE),
            })
            .mockResolvedValueOnce({ done: true, value: undefined }),
          cancel: vi.fn(),
        }),
      },
    });

    const { streamChatMessage } = await import("./actions");
    const result = await streamChatMessage(documentId, message);

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();

    if (result.data) {
      const events = [];
      for await (const event of result.data) {
        events.push(event);
      }
      expect(events).toContainEqual({ type: "done" });
    }

    global.fetch = originalFetch;
  });
});
