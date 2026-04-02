import { describe, it, expect, vi, beforeEach } from "vitest";

const mockTriggerIngestion = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    data: { triggered: true },
    error: null,
  }),
);

// Mock chain builders
const mockMaybeSingle = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: null }),
);
const mockSingle = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    data: {
      id: "doc-456",
      name: "Test Document.pdf",
      author: null,
      page_count: null,
      blob_url: "https://example.com/blob/test.pdf",
      thumbnail_url: null,
      size: 1024,
      user_id: "user-123",
      upload_date: new Date().toISOString(),
      current_page: 0,
      ingested_at: null,
      is_ingesting: false,
    },
    error: null,
  }),
);

const mockEqChain = vi.hoisted(() =>
  vi.fn().mockImplementation(function () {
    // Return self for chaining .eq().eq()
    return {
      eq: mockEqChain,
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
    };
  }),
);

const mockSelect = vi.hoisted(() =>
  vi.fn().mockImplementation(() => ({
    eq: mockEqChain,
  })),
);

const mockInsert = vi.hoisted(() =>
  vi.fn().mockImplementation(() => ({
    select: vi.fn().mockImplementation(() => ({
      single: mockSingle,
    })),
  })),
);

const mockFrom = vi.hoisted(() =>
  vi.fn().mockImplementation(() => ({
    select: mockSelect,
    insert: mockInsert,
  })),
);

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-123" } },
      }),
    },
  })),
}));

vi.mock("@/app/(dashboard)/actions", () => ({
  triggerIngestion: mockTriggerIngestion,
}));

import { saveDocumentAction } from "./actions";

describe("saveDocumentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls triggerIngestion with the document ID after successful save", async () => {
    const testData = {
      name: "Test Document.pdf",
      blobUrl: "https://example.com/blob/test.pdf",
      size: 1024,
    };

    await saveDocumentAction(testData);

    expect(mockTriggerIngestion).toHaveBeenCalledWith("doc-456");
  });

  it("does not call triggerIngestion when validation fails", async () => {
    const invalidData = {
      name: "",
      blobUrl: "https://example.com/blob/test.pdf",
      size: 1024,
    };

    await saveDocumentAction(invalidData);

    expect(mockTriggerIngestion).not.toHaveBeenCalled();
  });

  it("does not call triggerIngestion when document already exists", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: "existing-doc-id" },
    });

    const testData = {
      name: "Test Document.pdf",
      blobUrl: "https://example.com/blob/test.pdf",
      size: 1024,
    };

    await saveDocumentAction(testData);

    expect(mockTriggerIngestion).not.toHaveBeenCalled();
  });

  it("does not call triggerIngestion when database insertion fails", async () => {
    const mockSingleFail = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });
    mockInsert.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({ single: mockSingleFail }),
    });

    const testData = {
      name: "Test Document.pdf",
      blobUrl: "https://example.com/blob/test.pdf",
      size: 1024,
    };

    await saveDocumentAction(testData);

    expect(mockTriggerIngestion).not.toHaveBeenCalled();
  });

  it("logs error but does not fail when triggerIngestion throws", async () => {
    mockTriggerIngestion.mockRejectedValueOnce(new Error("Ingestion error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const testData = {
      name: "Test Document.pdf",
      blobUrl: "https://example.com/blob/test.pdf",
      size: 1024,
    };

    const result = await saveDocumentAction(testData);

    expect(result.data).toBeDefined();
    expect((result.data as { id: string }).id).toBe("doc-456");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to trigger ingestion:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});

describe("deleteBlobsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns successfully with empty data", async () => {
    const { deleteBlobsAction } = await import("./actions");

    const result = await deleteBlobsAction([]);

    expect(result).toEqual({ data: null });
  });
});
