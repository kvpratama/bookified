import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PdfViewer } from "./pdf-viewer";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter, useSearchParams } from "next/navigation";
import type { ChatDocument } from "./types";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => "/chat/doc-1"),
}));

const mockUpdateDocumentProgress = vi.fn();

vi.mock("./actions", () => ({
  updateDocumentProgress: (...args: unknown[]) =>
    mockUpdateDocumentProgress(...args),
}));

vi.mock("@/lib/hooks/use-keyboard-navigation", () => ({
  useKeyboardNavigation: () => {},
}));

const mockActions = {
  setPdfDocument: vi.fn(),
  setCurrentPage: vi.fn(),
  handleOutlineExtracted: vi.fn(),
  handlePageSelect: vi.fn(),
  toggleOutline: vi.fn(),
  closeOutline: vi.fn(),
  toggleChat: vi.fn(),
};

const mockState = {
  pdfDocument: null as null,
  currentPage: 1,
  outline: null as null,
  isOutlineLoading: false,
  hasOutline: false,
  outlineVisible: false,
  chatCollapsed: true,
  selectedPage: undefined as number | undefined,
};

vi.mock("./document-viewer-context", () => ({
  useDocumentViewer: () => ({
    state: mockState,
    actions: mockActions,
  }),
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
  ingested_at: "2026-03-31T00:00:00Z",
};

describe("PdfViewer", () => {
  beforeEach(() => {
    mockUpdateDocumentProgress.mockClear();
    Object.values(mockActions).forEach((fn) => fn.mockClear());
    mockState.pdfDocument = null;
    mockState.currentPage = 1;
    mockState.outline = null;
    mockState.isOutlineLoading = false;
    mockState.hasOutline = false;
    mockState.outlineVisible = false;
    mockState.chatCollapsed = true;
    mockState.selectedPage = undefined;
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as ReturnType<typeof useSearchParams>,
    );
    vi.mocked(useRouter).mockReturnValue({
      replace: vi.fn(),
    } as unknown as AppRouterInstance);
  });

  afterEach(() => {
    cleanup();
  });

  describe("Page Jump", () => {
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

  describe("Toolbar Navigation Buttons", () => {
    it("shows navigation buttons in the floating toolbar", async () => {
      render(<PdfViewer document={mockDocument} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
      });

      const prevButtons = screen.getAllByRole("button", {
        name: /previous page/i,
      });
      const nextButtons = screen.getAllByRole("button", { name: /next page/i });

      expect(prevButtons).toHaveLength(1);
      expect(nextButtons).toHaveLength(1);
    });

    it("disables previous button on first page", async () => {
      const firstPageDoc = { ...mockDocument, current_page: 1 };
      render(<PdfViewer document={firstPageDoc} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
      });

      const prevButton = screen.getByRole("button", {
        name: /previous page/i,
      });
      expect(prevButton).toBeDisabled();
    });

    it("disables next button on last page", async () => {
      const lastPageDoc = { ...mockDocument, current_page: 50 };
      render(<PdfViewer document={lastPageDoc} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
      });

      const nextButton = screen.getByRole("button", {
        name: /next page/i,
      });
      expect(nextButton).toBeDisabled();
    });
  });

  describe("URL Sync", () => {
    it("initializes currentPage from URL search params", async () => {
      const mockSearchParams = new URLSearchParams("page=10");
      vi.mocked(useSearchParams).mockReturnValue(
        mockSearchParams as ReturnType<typeof useSearchParams>,
      );

      render(<PdfViewer document={mockDocument} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/10\s*\/\s*50/)).toBeInTheDocument();
    });

    it("updates URL when page changes", async () => {
      const mockReplace = vi.fn();
      vi.mocked(useRouter).mockReturnValue({
        replace: mockReplace,
      } as unknown as AppRouterInstance);

      render(<PdfViewer document={mockDocument} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
      });

      const nextButton = screen.getByRole("button", {
        name: /next page/i,
      });
      fireEvent.click(nextButton);

      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining("page=6"),
        expect.any(Object),
      );
    });
  });

  describe("Outline Extraction", () => {
    it("calls handleOutlineExtracted with outline data when PDF loads", async () => {
      render(<PdfViewer document={mockDocument} />);

      await waitFor(() => {
        expect(mockActions.handleOutlineExtracted).toHaveBeenCalled();
      });
    });

    it("calls handleOutlineExtracted with null when PDF has no outline", async () => {
      render(<PdfViewer document={mockDocument} />);

      await waitFor(() => {
        expect(mockActions.handleOutlineExtracted).toHaveBeenCalledWith(
          null,
          false,
        );
      });
    });
  });

  describe("Zoom Controls", () => {
    it("renders zoom in and zoom out buttons with accessible names", async () => {
      render(<PdfViewer document={mockDocument} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: /zoom in/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /zoom out/i }),
      ).toBeInTheDocument();
    });

    it("displays initial zoom level as 100%", async () => {
      render(<PdfViewer document={mockDocument} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("zoom in button increases the displayed zoom percentage", async () => {
      render(<PdfViewer document={mockDocument} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
      });

      const zoomInButton = screen.getByRole("button", { name: /zoom in/i });
      fireEvent.click(zoomInButton);

      await waitFor(() => {
        expect(screen.getByText("110%")).toBeInTheDocument();
      });
    });

    it("zoom out button decreases the displayed zoom percentage", async () => {
      render(<PdfViewer document={mockDocument} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
      });

      const zoomOutButton = screen.getByRole("button", { name: /zoom out/i });
      fireEvent.click(zoomOutButton);

      await waitFor(() => {
        expect(screen.getByText("90%")).toBeInTheDocument();
      });
    });

    it("zoom in button is disabled at max scale (200%)", async () => {
      render(<PdfViewer document={mockDocument} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
      });

      const zoomInButton = screen.getByRole("button", { name: /zoom in/i });

      for (let i = 0; i < 10; i++) {
        fireEvent.click(zoomInButton);
      }

      await waitFor(() => {
        expect(screen.getByText("200%")).toBeInTheDocument();
      });
      expect(zoomInButton).toBeDisabled();
    });

    it("zoom out button is disabled at min scale (50%)", async () => {
      render(<PdfViewer document={mockDocument} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
      });

      const zoomOutButton = screen.getByRole("button", { name: /zoom out/i });

      for (let i = 0; i < 5; i++) {
        fireEvent.click(zoomOutButton);
      }

      await waitFor(() => {
        expect(screen.getByText("50%")).toBeInTheDocument();
      });
      expect(zoomOutButton).toBeDisabled();
    });
  });

  describe("Callbacks", () => {
    it("calls setPdfDocument when PDF loads", async () => {
      render(<PdfViewer document={mockDocument} />);

      await waitFor(() => {
        expect(mockActions.setPdfDocument).toHaveBeenCalledWith(
          expect.objectContaining({ numPages: 50 }),
        );
      });
    });

    it("calls setCurrentPage when current page changes", async () => {
      render(<PdfViewer document={mockDocument} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
      });

      mockActions.setCurrentPage.mockClear();

      const nextButton = screen.getByRole("button", { name: /next page/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockActions.setCurrentPage).toHaveBeenCalledWith(6);
      });
    });
  });

  describe("Loading / Error states", () => {
    it("shows loading indicator initially", () => {
      render(<PdfViewer document={mockDocument} />);

      expect(screen.getByText(/Loading Document/i)).toBeInTheDocument();
    });
  });

  describe("Page input edge case", () => {
    it("does not jump when non-numeric value is entered in page input", async () => {
      render(<PdfViewer document={mockDocument} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading Document/i)).not.toBeInTheDocument();
      });

      const pageCounter = screen.getByText(/5\s*\/\s*50/);
      fireEvent.click(pageCounter);

      const input = screen.getByRole("spinbutton");

      fireEvent.change(input, { target: { value: "abc" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
      });

      expect(screen.getByText(/5\s*\/\s*50/)).toBeInTheDocument();
    });
  });
});
