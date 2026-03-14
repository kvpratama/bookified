import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PdfViewer } from "./pdf-viewer";
import type { ChatDocument } from "./types";

const mockUpdateDocumentProgress = vi.fn();

vi.mock("./actions", () => ({
  updateDocumentProgress: (...args: unknown[]) =>
    mockUpdateDocumentProgress(...args),
}));

vi.mock("@/lib/hooks/use-keyboard-navigation", () => ({
  useKeyboardNavigation: () => {},
}));

vi.mock("react-pdf", () => ({
  Document: ({
    children,
    onLoadSuccess,
  }: {
    children: React.ReactNode;
    onLoadSuccess: (data: { numPages: number }) => void;
  }) => {
    // Simulate document load
    setTimeout(() => onLoadSuccess({ numPages: 50 }), 0);
    return <div data-testid="pdf-document">{children}</div>;
  },
  Page: ({ pageNumber }: { pageNumber: number }) => (
    <div data-testid={`pdf-page-${pageNumber}`}>Page {pageNumber}</div>
  ),
  pdfjs: {
    GlobalWorkerOptions: { workerSrc: "" },
  },
}));

const mockDocument: ChatDocument = {
  id: "doc-1",
  name: "Test_Document.pdf",
  author: "Test Author",
  page_count: 50,
  size: 1000000,
  blob_url: "blob:test-url",
  current_page: 5,
};

describe("PdfViewer - Page Jump", () => {
  beforeEach(() => {
    mockUpdateDocumentProgress.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("allows user to click page counter and jump to a specific page", async () => {
    render(<PdfViewer document={mockDocument} />);

    // Wait for document to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
    });

    // Find the page counter display (e.g., "5 / 50")
    const pageCounter = screen.getByText(/5\s*\/\s*50/);
    expect(pageCounter).toBeInTheDocument();

    // Click on the page counter to activate edit mode
    fireEvent.click(pageCounter);

    // Should show an input field
    const input = screen.getByRole("spinbutton");
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();

    // Type a new page number
    fireEvent.change(input, { target: { value: "25" } });

    // Press Enter to jump to that page
    fireEvent.keyDown(input, { key: "Enter" });

    // Should show the new page number
    await waitFor(() => {
      expect(screen.getByText(/25\s*\/\s*50/)).toBeInTheDocument();
    });
  });

  it("clamps page number to valid range when user enters out-of-range value", async () => {
    render(<PdfViewer document={mockDocument} />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
    });

    const pageCounter = screen.getByText(/5\s*\/\s*50/);
    fireEvent.click(pageCounter);

    const input = screen.getByRole("spinbutton");

    // Try to jump to page 999 (beyond max)
    fireEvent.change(input, { target: { value: "999" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Should clamp to max page (50)
    await waitFor(() => {
      expect(screen.getByText(/50\s*\/\s*50/)).toBeInTheDocument();
    });
  });

  it("clamps page number to 1 when user enters 0 or negative", async () => {
    render(<PdfViewer document={mockDocument} />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
    });

    const pageCounter = screen.getByText(/5\s*\/\s*50/);
    fireEvent.click(pageCounter);

    const input = screen.getByRole("spinbutton");

    // Try to jump to page 0
    fireEvent.change(input, { target: { value: "0" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Should clamp to page 1
    await waitFor(() => {
      expect(screen.getByText(/1\s*\/\s*50/)).toBeInTheDocument();
    });
  });

  it("exits edit mode when user presses Escape", async () => {
    render(<PdfViewer document={mockDocument} />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
    });

    const pageCounter = screen.getByText(/5\s*\/\s*50/);
    fireEvent.click(pageCounter);

    const input = screen.getByRole("spinbutton");
    expect(input).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(input, { key: "Escape" });

    // Input should be gone, back to display mode
    await waitFor(() => {
      expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    });

    // Should still show original page
    expect(screen.getByText(/5\s*\/\s*50/)).toBeInTheDocument();
  });

  it("exits edit mode when user clicks outside (onBlur)", async () => {
    render(<PdfViewer document={mockDocument} />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
    });

    const pageCounter = screen.getByText(/5\s*\/\s*50/);
    fireEvent.click(pageCounter);

    const input = screen.getByRole("spinbutton");
    expect(input).toBeInTheDocument();

    // Blur the input (click outside)
    fireEvent.blur(input);

    // Should exit edit mode
    await waitFor(() => {
      expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    });
  });
});
