import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEqUserId = vi.hoisted(() => vi.fn());
const mockEqId = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
const mockGetUser = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
);

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  })),
}));

import { updateDocumentProgress } from "./actions";
import { createClient } from "@/lib/supabase/server";

describe("updateDocumentProgress", () => {
  const documentId = "doc-123";
  const currentPage = 42;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockEqUserId.mockResolvedValue({ error: null });
    mockEqId.mockReturnValue({ eq: mockEqUserId });
    mockUpdate.mockReturnValue({ eq: mockEqId });
    mockFrom.mockReturnValue({ update: mockUpdate });
  });

  it("calls supabase with the correct arguments and server-generated timestamp", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-13T10:00:00Z"));

    await updateDocumentProgress(documentId, currentPage);

    expect(mockFrom).toHaveBeenCalledWith("documents");
    expect(mockUpdate).toHaveBeenCalledWith({
      current_page: currentPage,
      last_accessed: "2026-03-13T10:00:00.000Z",
    });
    expect(mockEqId).toHaveBeenCalledWith("id", documentId);
    expect(mockEqUserId).toHaveBeenCalledWith("user_id", "user-1");

    vi.useRealTimers();
  });

  it("returns { data: null, error: null } on success", async () => {
    const result = await updateDocumentProgress(documentId, currentPage);

    expect(result).toEqual({ data: null, error: null });
  });

  it("returns { data: null, error: 'Unauthorized' } when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await updateDocumentProgress(documentId, currentPage);

    expect(result).toEqual({ data: null, error: "Unauthorized" });
  });

  it("returns { data: null, error } when supabase returns an error", async () => {
    mockEqUserId.mockResolvedValue({ error: { message: "some error" } });

    const result = await updateDocumentProgress(documentId, currentPage);

    expect(result).toEqual({ data: null, error: "some error" });
  });

  it("returns { data: null, error } when createClient throws", async () => {
    vi.mocked(createClient).mockRejectedValueOnce(new Error("some message"));

    const result = await updateDocumentProgress(documentId, currentPage);

    expect(result).toEqual({ data: null, error: "some message" });
  });

  it("calls console.error when supabase returns an error", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const supabaseError = { message: "some error" };
    mockEqUserId.mockResolvedValue({ error: supabaseError });

    await updateDocumentProgress(documentId, currentPage);

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

    await updateDocumentProgress(documentId, currentPage);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error updating document progress:",
      "some message",
    );
  });
});
