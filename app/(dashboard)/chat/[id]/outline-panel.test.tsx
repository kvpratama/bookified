import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { OutlinePanel } from "./outline-panel";
import type { ChatDocument } from "./types";

// Mock react-pdf with configurable success/error behavior
const mockOutlineBehavior = vi.hoisted(() => ({
  shouldError: false,
}));

vi.mock("react-pdf", () => ({
  Document: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pdf-document">{children}</div>
  ),
  Outline: ({
    onLoadSuccess,
    onLoadError,
    onItemClick,
  }: {
    onLoadSuccess?: (outline: unknown) => void;
    onLoadError?: () => void;
    onItemClick?: (item: { pageNumber: number }) => void;
  }) => {
    // Simulate outline loading or error
    if (mockOutlineBehavior.shouldError) {
      if (onLoadError) {
        setTimeout(() => onLoadError(), 0);
      }
      return <div data-testid="pdf-outline-error">No outline available</div>;
    }

    if (onLoadSuccess) {
      setTimeout(
        () => onLoadSuccess([{ title: "Chapter 1", dest: null, items: [] }]),
        0,
      );
    }
    return (
      <div data-testid="pdf-outline">
        <button
          data-testid="outline-item"
          onClick={() => onItemClick?.({ pageNumber: 5 })}
        >
          Chapter 1
        </button>
      </div>
    );
  },
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: "",
    },
  },
}));

const mockDocument: ChatDocument = {
  id: "test-doc-1",
  name: "Test Document.pdf",
  author: "Test Author",
  page_count: 100,
  size: 1024000,
  blob_url: "https://example.com/test.pdf",
  current_page: 1,
};

describe("OutlinePanel", () => {
  afterEach(() => {
    cleanup();
    mockOutlineBehavior.shouldError = false; // Reset after each test
  });

  it("renders outline when PDF has bookmarks", async () => {
    const onPageSelect = vi.fn();
    const onOutlineLoad = vi.fn();

    render(
      <OutlinePanel
        document={mockDocument}
        onPageSelect={onPageSelect}
        visible={true}
        onOutlineLoad={onOutlineLoad}
      />,
    );

    expect(await screen.findByTestId("pdf-outline")).toBeInTheDocument();
  });

  it("calls onOutlineLoad when outline is successfully loaded", async () => {
    const onPageSelect = vi.fn();
    const onOutlineLoad = vi.fn();

    render(
      <OutlinePanel
        document={mockDocument}
        onPageSelect={onPageSelect}
        visible={true}
        onOutlineLoad={onOutlineLoad}
      />,
    );

    await vi.waitFor(() => expect(onOutlineLoad).toHaveBeenCalledWith(true));
  });

  it("is hidden when visible prop is false", () => {
    const onPageSelect = vi.fn();
    const onOutlineLoad = vi.fn();

    render(
      <OutlinePanel
        document={mockDocument}
        onPageSelect={onPageSelect}
        visible={false}
        onOutlineLoad={onOutlineLoad}
      />,
    );

    const panel = screen.getByTestId("outline-panel");
    expect(panel).toHaveClass("w-0");
  });

  it("is visible when visible prop is true", () => {
    const onPageSelect = vi.fn();
    const onOutlineLoad = vi.fn();

    render(
      <OutlinePanel
        document={mockDocument}
        onPageSelect={onPageSelect}
        visible={true}
        onOutlineLoad={onOutlineLoad}
      />,
    );

    const panel = screen.getByTestId("outline-panel");
    expect(panel).not.toHaveClass("w-0");
  });

  it("calls onPageSelect when outline item is clicked", async () => {
    const onPageSelect = vi.fn();
    const onOutlineLoad = vi.fn();

    render(
      <OutlinePanel
        document={mockDocument}
        onPageSelect={onPageSelect}
        visible={true}
        onOutlineLoad={onOutlineLoad}
      />,
    );

    const outlineItem = await screen.findByTestId("outline-item");
    outlineItem.click();

    expect(onPageSelect).toHaveBeenCalledWith(5);
  });

  it("applies library aesthetic styling classes", () => {
    const onPageSelect = vi.fn();
    const onOutlineLoad = vi.fn();

    render(
      <OutlinePanel
        document={mockDocument}
        onPageSelect={onPageSelect}
        visible={true}
        onOutlineLoad={onOutlineLoad}
      />,
    );

    const panel = screen.getByTestId("outline-panel");
    // Check for warm background and border styling
    expect(panel.className).toMatch(/bg-/);
    expect(panel.className).toMatch(/border-/);
  });

  it("calls onOutlineLoad with false when outline fails to load", async () => {
    mockOutlineBehavior.shouldError = true;

    const onPageSelect = vi.fn();
    const onOutlineLoad = vi.fn();

    render(
      <OutlinePanel
        document={mockDocument}
        onPageSelect={onPageSelect}
        visible={true}
        onOutlineLoad={onOutlineLoad}
      />,
    );

    await vi.waitFor(() => expect(onOutlineLoad).toHaveBeenCalledWith(false));
  });
});
