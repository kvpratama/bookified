import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
const mockGetUser = vi
  .fn()
  .mockResolvedValue({ data: { user: { id: "user-123" } } });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      getUser: mockGetUser,
    },
  })),
}));

const mockSeedWelcomeDocument = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/welcome-document", () => ({
  seedWelcomeDocument: (...args: unknown[]) => mockSeedWelcomeDocument(...args),
}));

vi.mock("@/lib/validate-redirect", () => ({
  validateRedirect: vi.fn().mockReturnValue("/dashboard"),
}));

import { GET } from "./route";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockSeedWelcomeDocument.mockResolvedValue(undefined);
  });

  it("calls seedWelcomeDocument after successful auth", async () => {
    const request = new Request(
      "http://localhost:3000/auth/callback?code=valid-code",
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(mockSeedWelcomeDocument).toHaveBeenCalledWith("user-123");
  });

  it("does not call seedWelcomeDocument when auth fails", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: { message: "invalid" },
    });

    const request = new Request(
      "http://localhost:3000/auth/callback?code=bad-code",
    );

    await GET(request);

    expect(mockSeedWelcomeDocument).not.toHaveBeenCalled();
  });

  it("does not call seedWelcomeDocument when no code is provided", async () => {
    const request = new Request("http://localhost:3000/auth/callback");

    await GET(request);

    expect(mockSeedWelcomeDocument).not.toHaveBeenCalled();
  });

  it("redirects successfully even if seedWelcomeDocument fails", async () => {
    mockSeedWelcomeDocument.mockRejectedValue(new Error("seed failed"));

    const request = new Request(
      "http://localhost:3000/auth/callback?code=valid-code",
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
  });
});
