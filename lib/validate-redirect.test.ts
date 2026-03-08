import { describe, it, expect } from "vitest";
import { validateRedirect } from "./validate-redirect";

describe("validateRedirect", () => {
  it("allows valid relative paths", () => {
    expect(validateRedirect("/dashboard")).toBe("/dashboard");
    expect(validateRedirect("/upload")).toBe("/upload");
    expect(validateRedirect("/chat/123")).toBe("/chat/123");
  });

  it("rejects protocol-relative URLs", () => {
    expect(validateRedirect("//evil.com")).toBe("/dashboard");
    expect(validateRedirect("//evil.com/path")).toBe("/dashboard");
  });

  it("rejects absolute URLs", () => {
    expect(validateRedirect("https://evil.com")).toBe("/dashboard");
    expect(validateRedirect("http://evil.com")).toBe("/dashboard");
  });

  it("rejects non-slash paths", () => {
    expect(validateRedirect("evil.com")).toBe("/dashboard");
    expect(validateRedirect("javascript:alert(1)")).toBe("/dashboard");
  });

  it("returns default for undefined or empty", () => {
    expect(validateRedirect(undefined)).toBe("/dashboard");
    expect(validateRedirect("")).toBe("/dashboard");
  });
});
