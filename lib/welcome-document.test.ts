import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

const mockContext = {
  existingDocCount: 0,
  insertError: null as { message: string } | null,
};

const mockLimit = vi.fn().mockImplementation(async () => ({
  count: mockContext.existingDocCount,
  error: null,
}));

const mockEq: unknown = vi.fn();
(mockEq as Mock).mockImplementation(() => ({
  limit: mockLimit,
  eq: mockEq,
}));

const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

const mockInsertSingle = vi.fn().mockImplementation(async () => ({
  data: { id: "new-doc-id" },
  error: mockContext.insertError,
}));

const mockInsertSelect = vi.fn().mockReturnValue({ single: mockInsertSingle });

const mockInsert = vi.fn().mockReturnValue({ select: mockInsertSelect });

const mockFrom = vi.fn().mockImplementation(() => ({
  select: mockSelect,
  insert: mockInsert,
}));

const mockGetSession = vi.fn().mockResolvedValue({
  data: { session: { access_token: "test-token" } },
});

const mockSupabase = {
  from: mockFrom,
  auth: { getSession: mockGetSession },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => mockSupabase),
}));

import { seedWelcomeDocument } from "./welcome-document";

describe("seedWelcomeDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext.existingDocCount = 0;
    mockContext.insertError = null;

    vi.stubEnv(
      "WELCOME_DOCUMENT_BLOB_URL",
      "https://blob.example.com/welcome.pdf",
    );
    vi.stubEnv(
      "WELCOME_DOCUMENT_THUMBNAIL_URL",
      "https://blob.example.com/welcome-thumb.png",
    );
    vi.stubEnv("BOOKIFIED_API_ENDPOINT", "https://api.example.com");

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it("inserts welcome document when user has no documents", async () => {
    await seedWelcomeDocument("user-123");

    expect(mockFrom).toHaveBeenCalledWith("documents");
    expect(mockSelect).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-123");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Welcome to Sanctuary.pdf",
        user_id: "user-123",
        blob_url: "https://blob.example.com/welcome.pdf",
      }),
    );
  });

  it("skips seeding when user already has documents", async () => {
    mockContext.existingDocCount = 3;

    await seedWelcomeDocument("user-123");

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("skips seeding when WELCOME_DOCUMENT_BLOB_URL is not set", async () => {
    vi.stubEnv("WELCOME_DOCUMENT_BLOB_URL", "");

    await seedWelcomeDocument("user-123");

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("triggers ingestion after inserting welcome document", async () => {
    await seedWelcomeDocument("user-123");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.example.com/ingest/new-doc-id",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("does not throw when insert fails", async () => {
    mockContext.insertError = { message: "duplicate" };

    await expect(seedWelcomeDocument("user-123")).resolves.not.toThrow();
  });
});
