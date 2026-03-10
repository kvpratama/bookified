import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import UploadPage from "./page";

// Mock next/navigation
const mockPush = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the store
const mockAddDocument = vi.hoisted(() => vi.fn());
vi.mock("@/lib/store", () => ({
  useAppStore: (
    selector: (state: { addDocument: typeof mockAddDocument }) => unknown,
  ) => selector({ addDocument: mockAddDocument }),
}));

function createFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("UploadPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
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

  it("shows upload progress for valid PDF", () => {
    render(<UploadPage />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = createFile("valid.pdf", 1024, "application/pdf");
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("Uploading...")).toBeInTheDocument();
    expect(screen.getByText("valid.pdf")).toBeInTheDocument();
  });

  it("completes upload and adds document to store", () => {
    render(<UploadPage />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = createFile("book.pdf", 2048, "application/pdf");
    fireEvent.change(input, { target: { files: [file] } });

    // Fast-forward through the simulated upload
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(mockAddDocument).toHaveBeenCalledTimes(1);
    expect(mockAddDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "book.pdf",
        size: 2048,
      }),
    );
  });

  it("shows dashboard button after successful upload", () => {
    render(<UploadPage />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = createFile("book.pdf", 2048, "application/pdf");
    fireEvent.change(input, { target: { files: [file] } });

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    const dashboardButton = screen.getByRole("button", {
      name: /go to dashboard/i,
    });
    fireEvent.click(dashboardButton);
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("resets state when clicking 'Upload another file'", () => {
    render(<UploadPage />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = createFile("book.pdf", 2048, "application/pdf");
    fireEvent.change(input, { target: { files: [file] } });

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    const uploadAnotherButton = screen.getByRole("button", {
      name: /upload another file/i,
    });
    fireEvent.click(uploadAnotherButton);

    // Should be back to idle state with the drop zone
    expect(
      screen.getByRole("button", { name: /select file/i }),
    ).toBeInTheDocument();
  });
});
