import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { ExtractedMetadata } from "./upload-schema";
import UploadPage from "./page";

const mockPush = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockExtractPdfMetadata = vi.hoisted(() => vi.fn());
vi.mock("@/app/(dashboard)/upload/pdf-utils", () => ({
  extractPdfMetadata: mockExtractPdfMetadata,
}));

function createFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("UploadPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the upload heading and drop zone", () => {
    render(<UploadPage />);
    expect(
      screen.getByRole("heading", { name: /upload document/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /select file/i }),
    ).toBeInTheDocument();
  });

  it("shows error for non-PDF file", () => {
    render(<UploadPage />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = createFile("document.txt", 100, "text/plain");
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("Please upload a PDF file.")).toBeInTheDocument();
  });

  it("shows error for file exceeding 10MB", () => {
    render(<UploadPage />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = createFile("large.pdf", 11 * 1024 * 1024, "application/pdf");
    fireEvent.change(input, { target: { files: [file] } });

    expect(
      screen.getByText("File size exceeds the 10MB limit."),
    ).toBeInTheDocument();
  });

  it("shows processing state for valid PDF", () => {
    mockExtractPdfMetadata.mockReturnValue(new Promise(() => {}));

    render(<UploadPage />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = createFile("valid.pdf", 1024, "application/pdf");
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("Processing PDF...")).toBeInTheDocument();
    expect(screen.getByText("valid.pdf")).toBeInTheDocument();
  });

  it("shows metadata form after extraction", async () => {
    const metadata: ExtractedMetadata = {
      name: "My Document",
      author: "Test Author",
      pageCount: 42,
      thumbnailDataUrl: null,
    };

    mockExtractPdfMetadata.mockResolvedValueOnce(metadata);

    render(<UploadPage />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = createFile("book.pdf", 2048, "application/pdf");
    fireEvent.change(input, { target: { files: [file] } });

    expect(
      await screen.findByLabelText(/document name/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/document name/i)).toHaveValue("My Document");
    expect(screen.getByLabelText(/author/i)).toHaveValue("Test Author");
  });

  it("shows error when extraction fails", async () => {
    mockExtractPdfMetadata.mockRejectedValueOnce(new Error("parse error"));

    render(<UploadPage />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = createFile("bad.pdf", 1024, "application/pdf");
    fireEvent.change(input, { target: { files: [file] } });

    expect(
      await screen.findByText("Failed to process PDF. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /select file/i }),
    ).toBeInTheDocument();
  });

  it("resets state when clicking cancel on metadata form", async () => {
    const metadata: ExtractedMetadata = {
      name: "My Document",
      author: null,
      pageCount: 10,
      thumbnailDataUrl: null,
    };

    mockExtractPdfMetadata.mockResolvedValueOnce(metadata);

    render(<UploadPage />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = createFile("book.pdf", 2048, "application/pdf");
    fireEvent.change(input, { target: { files: [file] } });

    await screen.findByLabelText(/document name/i);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(
      screen.getByRole("button", { name: /select file/i }),
    ).toBeInTheDocument();
  });
});
