import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

describe("supabase env utilities", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("supabaseUrl reads from NEXT_PUBLIC_SUPABASE_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");

    const { supabaseUrl } = await import("./env");

    expect(supabaseUrl).toBe("https://test.supabase.co");
  });

  it("supabaseKey prefers NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY when both are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    const { supabaseKey } = await import("./env");

    expect(supabaseKey).toBe("publishable-key");
  });

  it("supabaseKey falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY when publishable key is not set", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    const { supabaseKey } = await import("./env");

    expect(supabaseKey).toBe("anon-key");
  });
});
