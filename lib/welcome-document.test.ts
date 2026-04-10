import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpsertSingle = vi.fn();

const mockUpsertSelect = vi.fn().mockReturnValue({ single: mockUpsertSingle });

const mockUpsert = vi.fn().mockReturnValue({ select: mockUpsertSelect });

const mockFrom = vi.fn().mockImplementation(() => ({
  upsert: mockUpsert,
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

    mockUpsertSingle.mockResolvedValue({
      data: { id: "new-doc-id" },
      error: null,
    });

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
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Welcome to Sanctuary.pdf",
        user_id: "user-123",
        blob_url: "https://blob.example.com/welcome.pdf",
      }),
      { onConflict: "user_id,name", ignoreDuplicates: true },
    );
  });

  it("skips ingestion when welcome document already exists", async () => {
    mockUpsertSingle.mockResolvedValue({
      data: null,
      error: { message: "No rows returned" },
    });

    await seedWelcomeDocument("user-123");

    expect(mockUpsert).toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
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

  it("skips ingestion when BOOKIFIED_API_ENDPOINT is not set", async () => {
    vi.stubEnv("BOOKIFIED_API_ENDPOINT", "");

    await seedWelcomeDocument("user-123");

    expect(mockUpsert).toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("does not throw when upsert fails", async () => {
    mockUpsertSingle.mockResolvedValue({
      data: null,
      error: { message: "duplicate" },
    });

    await expect(seedWelcomeDocument("user-123")).resolves.not.toThrow();
  });
});
