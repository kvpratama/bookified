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

describe("formatBytes", () => {
  it("formats small bytes correctly", async () => {
    const { formatBytes } = await import("./utils");
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(500)).toBe("500 byte");
  });

  it("formats kilobytes correctly", async () => {
    const { formatBytes } = await import("./utils");
    expect(formatBytes(1024)).toBe("1 kB");
    expect(formatBytes(1536)).toBe("1.5 kB");
  });

  it("formats megabytes correctly", async () => {
    const { formatBytes } = await import("./utils");
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
    expect(formatBytes(1024 * 1024 * 1.25)).toBe("1.25 MB");
  });

  it("respects decimal parameter", async () => {
    const { formatBytes } = await import("./utils");
    expect(formatBytes(1024 * 1024 * 1.255, 1)).toBe("1.3 MB");
    expect(formatBytes(1024 * 1024 * 1.255, 2)).toBe("1.26 MB");
  });
});

describe("formatDocumentName", () => {
  it("removes .pdf extension case-insensitively", async () => {
    const { formatDocumentName } = await import("./utils");
    expect(formatDocumentName("My Book.pdf")).toBe("My Book");
    expect(formatDocumentName("ANOTHER_ONE.PDF")).toBe("ANOTHER ONE");
  });

  it("replaces underscores with spaces", async () => {
    const { formatDocumentName } = await import("./utils");
    expect(formatDocumentName("getting_started_with_nextjs.pdf")).toBe(
      "getting started with nextjs",
    );
  });
});
