import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

describe("getBaseUrl", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns NEXT_PUBLIC_BASE_URL when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://myapp.com");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "my-app.vercel.app");

    const { getBaseUrl } = await import("./utils");

    expect(getBaseUrl()).toBe("https://myapp.com");
  });

  it("returns https:// prefixed NEXT_PUBLIC_VERCEL_URL when base URL is not set", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "my-app-abc123.vercel.app");

    const { getBaseUrl } = await import("./utils");

    expect(getBaseUrl()).toBe("https://my-app-abc123.vercel.app");
  });

  it("returns window.location.origin in browser when no env vars are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "");

    const { getBaseUrl } = await import("./utils");

    expect(getBaseUrl()).toBe("http://localhost:3000");
  });

  it("returns localhost fallback when no env vars and no window", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "");
    const originalWindow = globalThis.window;
    // @ts-expect-error -- removing window to simulate server environment
    delete globalThis.window;

    try {
      const { getBaseUrl } = await import("./utils");
      expect(getBaseUrl()).toBe("http://localhost:3000");
    } finally {
      globalThis.window = originalWindow;
    }
  });
});
