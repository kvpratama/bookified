import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

describe("supabase env utilities", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("supabaseUrl reads from NEXT_PUBLIC_SUPABASE_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-key");

    const { supabaseUrl } = await import("./env");

    expect(supabaseUrl).toBe("https://test.supabase.co");
  });

  it("supabaseKey prefers NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY when both are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    const { supabaseKey } = await import("./env");

    expect(supabaseKey).toBe("publishable-key");
  });

  it("supabaseKey falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY when publishable key is not set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    const { supabaseKey } = await import("./env");

    expect(supabaseKey).toBe("anon-key");
  });
});
