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
      getSession: vi
        .fn()
        .mockImplementation(async () => ({
          data: { session: mockContext.session },
        })),
    },
  })),
}));

import { updateDocumentProgress, triggerIngestion } from "./actions";

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

describe("triggerIngestion", () => {
  const documentId = "doc-456";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BOOKIFIED_API_ENDPOINT", "https://api.example.com");

    mockContext.data = { is_ingesting: false, ingested_at: null };
    mockContext.error = null;
    mockContext.session = { access_token: "token-123" };
    mockContext.user = { id: "user-1" };

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it("calls ingestion API when document is idle (best-effort select only)", async () => {
    const result = await triggerIngestion(documentId);

    expect(mockFrom).toHaveBeenCalledWith("documents");
    expect(mockSelect).toHaveBeenCalledWith("is_ingesting, ingested_at");
    // We expect NO update call because locking is delegated to the backend
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `https://api.example.com/ingest/${documentId}`,
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual({ data: { triggered: true }, error: null });
  });

  it("skips the API call when document is already ingesting (best-effort)", async () => {
    mockContext.data = { is_ingesting: true, ingested_at: null };
    const result = await triggerIngestion(documentId);

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result).toEqual({ data: { triggered: false }, error: null });
  });

  it("skips the API call when document is already ingested", async () => {
    mockContext.data = {
      is_ingesting: false,
      ingested_at: "2026-03-31T00:00:00Z",
    };
    const result = await triggerIngestion(documentId);

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result).toEqual({ data: { triggered: false }, error: null });
  });

  it("returns error when status check fails", async () => {
    mockContext.error = { message: "DB error" };
    const result = await triggerIngestion(documentId);

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result).toEqual({ data: null, error: "DB error" });
  });

  it("returns error unauthorized when no session", async () => {
    mockContext.session = null;
    const result = await triggerIngestion(documentId);

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result).toEqual({ data: null, error: "Unauthorized" });
  });
});
