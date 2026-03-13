import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEq = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: mockFrom,
  })),
}));

import { updateDocumentProgress } from "./actions";
import { createClient } from "@/lib/supabase/server";

describe("updateDocumentProgress", () => {
  const documentId = "doc-123";
  const currentPage = 42;
  const lastAccessed = "2026-03-13T10:00:00Z";

  beforeEach(() => {
    vi.restoreAllMocks();
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });
  });

  it("calls supabase with the correct arguments", async () => {
    await updateDocumentProgress(documentId, currentPage, lastAccessed);

    expect(mockFrom).toHaveBeenCalledWith("documents");
    expect(mockUpdate).toHaveBeenCalledWith({
      current_page: currentPage,
      last_accessed: lastAccessed,
    });
    expect(mockEq).toHaveBeenCalledWith("id", documentId);
  });

  it("returns { data: null, error: null } on success", async () => {
    const result = await updateDocumentProgress(
      documentId,
      currentPage,
      lastAccessed,
    );

    expect(result).toEqual({ data: null, error: null });
  });

  it("returns { data: null, error } when supabase returns an error", async () => {
    mockEq.mockResolvedValue({ error: { message: "some error" } });

    const result = await updateDocumentProgress(
      documentId,
      currentPage,
      lastAccessed,
    );

    expect(result).toEqual({ data: null, error: "some error" });
  });

  it("returns { data: null, error } when createClient throws", async () => {
    vi.mocked(createClient).mockRejectedValueOnce(new Error("some message"));

    const result = await updateDocumentProgress(
      documentId,
      currentPage,
      lastAccessed,
    );

    expect(result).toEqual({ data: null, error: "some message" });
  });

  it("calls console.error when supabase returns an error", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const supabaseError = { message: "some error" };
    mockEq.mockResolvedValue({ error: supabaseError });

    await updateDocumentProgress(documentId, currentPage, lastAccessed);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to update document progress:",
      supabaseError,
    );
  });

  it("calls console.error when createClient throws", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(createClient).mockRejectedValueOnce(new Error("some message"));

    await updateDocumentProgress(documentId, currentPage, lastAccessed);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error updating document progress:",
      "some message",
    );
  });
});
