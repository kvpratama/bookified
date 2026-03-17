import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { OutlinePanel } from "./outline-panel";

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

const mockOutline = [
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
  afterEach(() => {
    cleanup();
  });

  it("renders outline items when outline data is provided", () => {
    const onPageSelect = vi.fn();

    render(
      <OutlinePanel
        outline={mockOutline}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Chapter 1")).toBeInTheDocument();
    expect(screen.getByText("Chapter 2")).toBeInTheDocument();
  });

  it("shows loading state when isLoading is true", () => {
    const onPageSelect = vi.fn();

    render(
      <OutlinePanel
        outline={null}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={true}
      />,
    );

    expect(screen.getByText(/Loading outline/i)).toBeInTheDocument();
  });

  it("is hidden when visible prop is false", () => {
    const onPageSelect = vi.fn();

    render(
      <OutlinePanel
        outline={mockOutline}
        onPageSelect={onPageSelect}
        visible={false}
        isLoading={false}
      />,
    );

    const panel = screen.getByTestId("outline-panel");
    expect(panel).toHaveClass("w-0");
  });

  it("is visible when visible prop is true", () => {
    const onPageSelect = vi.fn();

    render(
      <OutlinePanel
        outline={mockOutline}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={false}
      />,
    );

    const panel = screen.getByTestId("outline-panel");
    expect(panel).not.toHaveClass("w-0");
  });

  it("does not render Document component", () => {
    const onPageSelect = vi.fn();

    render(
      <OutlinePanel
        outline={mockOutline}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={false}
      />,
    );

    expect(screen.queryByTestId("pdf-document")).not.toBeInTheDocument();
  });

  it("renders nested outline items", () => {
    const onPageSelect = vi.fn();

    render(
      <OutlinePanel
        outline={mockOutline}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Section 1.1")).toBeInTheDocument();
    expect(screen.getByText("Section 1.2")).toBeInTheDocument();
  });

  it("renders 'Contents' header", () => {
    const onPageSelect = vi.fn();

    render(
      <OutlinePanel
        outline={mockOutline}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Contents")).toBeInTheDocument();
  });

  it("shows empty state when outline is empty array", () => {
    const onPageSelect = vi.fn();

    render(
      <OutlinePanel
        outline={[]}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={false}
      />,
    );

    expect(screen.getByText("No contents available")).toBeInTheDocument();
  });

  it("shows empty state when outline is null and not loading", () => {
    const onPageSelect = vi.fn();

    render(
      <OutlinePanel
        outline={null}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={false}
      />,
    );

    expect(screen.getByText("No contents available")).toBeInTheDocument();
  });

  it("does not call onPageSelect when clicking item without pdfDocument", () => {
    const onPageSelect = vi.fn();
    const outlineWithDest = [
      { title: "Test Chapter", dest: "chapter1", items: [] },
    ];

    render(
      <OutlinePanel
        outline={outlineWithDest}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={false}
      />,
    );

    fireEvent.click(screen.getByText("Test Chapter"));
    expect(onPageSelect).not.toHaveBeenCalled();
  });

  it("calls onPageSelect when clicking item with pdfDocument and valid dest", async () => {
    const onPageSelect = vi.fn();
    const mockPdfDocument = {
      getDestination: vi.fn().mockResolvedValue([{ num: 0 }, "Fit"]),
      getPageIndex: vi.fn().mockResolvedValue(4),
    } as unknown as PDFDocumentProxy;
    const outlineWithDest = [
      { title: "Named Chapter", dest: "named-dest", items: [] },
    ];

    render(
      <OutlinePanel
        outline={outlineWithDest}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={false}
        pdfDocument={mockPdfDocument}
      />,
    );

    fireEvent.click(screen.getByText("Named Chapter"));

    await waitFor(() => {
      expect(onPageSelect).toHaveBeenCalledWith(5);
    });
  });

  it("calls onPageSelect(1) and shows toast on navigation error", async () => {
    const onPageSelect = vi.fn();
    const mockPdfDocument = {
      getDestination: vi
        .fn()
        .mockRejectedValue(new Error("destination not found")),
      getPageIndex: vi.fn(),
    } as unknown as PDFDocumentProxy;
    const outlineWithDest = [
      { title: "Bad Chapter", dest: "bad-dest", items: [] },
    ];

    render(
      <OutlinePanel
        outline={outlineWithDest}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={false}
        pdfDocument={mockPdfDocument}
      />,
    );

    fireEvent.click(screen.getByText("Bad Chapter"));

    await waitFor(() => {
      expect(onPageSelect).toHaveBeenCalledWith(1);
    });
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining("Failed to navigate"),
    );
  });

  it("shows active item indicator for current page", async () => {
    const onPageSelect = vi.fn();
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

    render(
      <OutlinePanel
        outline={outlineWithDest}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={false}
        pdfDocument={mockPdfDocument}
        currentPage={1}
      />,
    );

    await waitFor(() => {
      const chapterAButton = screen.getByRole("button", { name: /Chapter A/ });
      expect(chapterAButton.textContent).toContain("→");
    });
  });

  it("loading skeleton has role='status' for accessibility", () => {
    const onPageSelect = vi.fn();

    render(
      <OutlinePanel
        outline={null}
        onPageSelect={onPageSelect}
        visible={true}
        isLoading={true}
      />,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
