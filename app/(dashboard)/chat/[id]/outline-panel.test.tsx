import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { OutlinePanel } from "./outline-panel";
import type { OutlineItem } from "./types";

const mockToastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: mockToastError } }));

// Mock react-pdf - no longer needed in OutlinePanel
vi.mock("react-pdf", () => ({
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: "",
    },
  },
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
  pdfDocument: null as PDFDocumentProxy | null,
  currentPage: 1,
  outline: null as OutlineItem[] | null,
  isOutlineLoading: false,
  hasOutline: false,
  outlineVisible: true,
  chatCollapsed: true,
  selectedPage: undefined as number | undefined,
};

vi.mock("./document-viewer-context", () => ({
  useDocumentViewer: () => ({
    state: mockState,
    actions: mockActions,
  }),
}));

const mockOutline: OutlineItem[] = [
  {
    title: "Chapter 1",
    dest: null,
    items: [
      { title: "Section 1.1", dest: null, items: [] },
      { title: "Section 1.2", dest: null, items: [] },
    ],
  },
  {
    title: "Chapter 2",
    dest: null,
    items: [],
  },
];

describe("OutlinePanel", () => {
  beforeEach(() => {
    mockState.pdfDocument = null;
    mockState.currentPage = 1;
    mockState.outline = null;
    mockState.isOutlineLoading = false;
    mockState.hasOutline = false;
    mockState.outlineVisible = true;
    mockState.chatCollapsed = true;
    mockState.selectedPage = undefined;
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders outline items when outline data is provided", () => {
    mockState.outline = mockOutline;
    mockState.outlineVisible = true;
    mockState.isOutlineLoading = false;

    render(<OutlinePanel />);

    expect(screen.getByText("Chapter 1")).toBeInTheDocument();
    expect(screen.getByText("Chapter 2")).toBeInTheDocument();
  });

  it("shows loading state when isLoading is true", () => {
    mockState.outline = null;
    mockState.outlineVisible = true;
    mockState.isOutlineLoading = true;

    render(<OutlinePanel />);

    expect(screen.getByText(/Loading outline/i)).toBeInTheDocument();
  });

  it("is hidden when visible prop is false", () => {
    mockState.outline = mockOutline;
    mockState.outlineVisible = false;
    mockState.isOutlineLoading = false;

    render(<OutlinePanel />);

    const panel = screen.getByTestId("outline-panel");
    expect(panel).toHaveClass("w-0");
  });

  it("is visible when visible prop is true", () => {
    mockState.outline = mockOutline;
    mockState.outlineVisible = true;
    mockState.isOutlineLoading = false;

    render(<OutlinePanel />);

    const panel = screen.getByTestId("outline-panel");
    expect(panel).not.toHaveClass("w-0");
  });

  it("does not render Document component", () => {
    mockState.outline = mockOutline;
    mockState.outlineVisible = true;
    mockState.isOutlineLoading = false;

    render(<OutlinePanel />);

    expect(screen.queryByTestId("pdf-document")).not.toBeInTheDocument();
  });

  it("renders nested outline items", () => {
    mockState.outline = mockOutline;
    mockState.outlineVisible = true;
    mockState.isOutlineLoading = false;

    render(<OutlinePanel />);

    expect(screen.getByText("Section 1.1")).toBeInTheDocument();
    expect(screen.getByText("Section 1.2")).toBeInTheDocument();
  });

  it("renders 'Contents' header", () => {
    mockState.outline = mockOutline;
    mockState.outlineVisible = true;
    mockState.isOutlineLoading = false;

    render(<OutlinePanel />);

    expect(screen.getByText("Contents")).toBeInTheDocument();
  });

  it("shows empty state when outline is empty array", () => {
    mockState.outline = [];
    mockState.outlineVisible = true;
    mockState.isOutlineLoading = false;

    render(<OutlinePanel />);

    expect(screen.getByText("No contents available")).toBeInTheDocument();
  });

  it("shows empty state when outline is null and not loading", () => {
    mockState.outline = null;
    mockState.outlineVisible = true;
    mockState.isOutlineLoading = false;

    render(<OutlinePanel />);

    expect(screen.getByText("No contents available")).toBeInTheDocument();
  });

  it("does not call onPageSelect when clicking item without pdfDocument", () => {
    const outlineWithDest = [
      { title: "Test Chapter", dest: "chapter1", items: [] },
    ];
    mockState.outline = outlineWithDest;
    mockState.outlineVisible = true;
    mockState.isOutlineLoading = false;
    mockState.pdfDocument = null;

    render(<OutlinePanel />);

    fireEvent.click(screen.getByText("Test Chapter"));
    expect(mockActions.handlePageSelect).not.toHaveBeenCalled();
  });

  it("calls onPageSelect when clicking item with pdfDocument and valid dest", async () => {
    const mockPdfDocument = {
      getDestination: vi.fn().mockResolvedValue([{ num: 0 }, "Fit"]),
      getPageIndex: vi.fn().mockResolvedValue(4),
    } as unknown as PDFDocumentProxy;
    const outlineWithDest = [
      { title: "Named Chapter", dest: "named-dest", items: [] },
    ];

    mockState.outline = outlineWithDest;
    mockState.outlineVisible = true;
    mockState.isOutlineLoading = false;
    mockState.pdfDocument = mockPdfDocument;

    render(<OutlinePanel />);

    fireEvent.click(screen.getByText("Named Chapter"));

    await waitFor(() => {
      expect(mockActions.handlePageSelect).toHaveBeenCalledWith(5);
    });
  });

  it("calls onPageSelect(1) and shows toast on navigation error", async () => {
    const mockPdfDocument = {
      getDestination: vi
        .fn()
        .mockRejectedValue(new Error("destination not found")),
      getPageIndex: vi.fn(),
    } as unknown as PDFDocumentProxy;
    const outlineWithDest = [
      { title: "Bad Chapter", dest: "bad-dest", items: [] },
    ];

    mockState.outline = outlineWithDest;
    mockState.outlineVisible = true;
    mockState.isOutlineLoading = false;
    mockState.pdfDocument = mockPdfDocument;

    render(<OutlinePanel />);

    fireEvent.click(screen.getByText("Bad Chapter"));

    await waitFor(() => {
      expect(mockActions.handlePageSelect).toHaveBeenCalledWith(1);
    });
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining("Failed to navigate"),
    );
  });

  it("shows active item indicator for current page", async () => {
    const refA = { num: 0 };
    const refB = { num: 1 };
    const mockPdfDocument = {
      getDestination: vi.fn(),
      getPageIndex: vi
        .fn()
        .mockImplementation((ref: { num: number }) => Promise.resolve(ref.num)),
    } as unknown as PDFDocumentProxy;
    const outlineWithDest = [
      { title: "Chapter A", dest: [refA, "Fit"], items: [] },
      { title: "Chapter B", dest: [refB, "Fit"], items: [] },
    ];

    mockState.outline = outlineWithDest;
    mockState.outlineVisible = true;
    mockState.isOutlineLoading = false;
    mockState.pdfDocument = mockPdfDocument;
    mockState.currentPage = 1;

    render(<OutlinePanel />);

    await waitFor(() => {
      const chapterAButton = screen.getByRole("button", { name: /Chapter A/ });
      expect(chapterAButton.textContent).toContain("→");
    });
  });

  it("loading skeleton has role='status' for accessibility", () => {
    mockState.outline = null;
    mockState.outlineVisible = true;
    mockState.isOutlineLoading = true;

    render(<OutlinePanel />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
