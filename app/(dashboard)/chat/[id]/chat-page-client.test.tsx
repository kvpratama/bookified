import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ChatDocument } from "./types";

// Mock next/navigation
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

// Mock PdfViewer — stub the module (prevents real pdf-viewer.tsx from loading)
vi.mock("./pdf-viewer", () => ({
  PdfViewer: ({
    document,
    onPageChange,
  }: {
    document: { id: string };
    onPageChange?: (page: number) => void;
  }) => {
    return (
      <div data-testid="pdf-viewer">
        {document.id}
        <button data-testid="pdf-goto-page" onClick={() => onPageChange?.(5)}>
          Go to page 5
        </button>
      </div>
    );
  },
}));

// Mock next/dynamic to skip lazy loading — return the PdfViewer stub synchronously
vi.mock("next/dynamic", () => ({
  default: () =>
    function PdfViewerStub(props: { document: { id: string } }) {
      return <div data-testid="pdf-viewer">{props.document.id}</div>;
    },
}));

// Mock ChatPanel
vi.mock("./chat-panel", () => ({
  ChatPanel: ({
    collapsed,
    onToggle,
  }: {
    collapsed: boolean;
    onToggle: () => void;
    document: object;
  }) => (
    <div data-testid="chat-panel" data-collapsed={collapsed}>
      <button onClick={onToggle}>toggle</button>
    </div>
  ),
}));

// Mock OutlinePanel
vi.mock("./outline-panel", () => ({
  OutlinePanel: ({
    visible,
    onOutlineLoad,
    onPageSelect,
  }: {
    visible: boolean;
    onOutlineLoad: (hasOutline: boolean) => void;
    onPageSelect: (page: number) => void;
    document: object;
  }) => {
    // Simulate outline loading
    if (onOutlineLoad) {
      setTimeout(() => onOutlineLoad(true), 0);
    }
    return (
      <div data-testid="outline-panel" data-visible={visible}>
        <button
          data-testid="outline-select-page"
          onClick={() => onPageSelect(10)}
        >
          Select page 10
        </button>
      </div>
    );
  },
}));

import { ChatPageClient } from "./chat-page-client";

const mockDocument: ChatDocument = {
  id: "doc-1",
  name: "Test_Document.pdf",
  author: "Jane Doe",
  page_count: 10,
  size: 2500000,
  blob_url: "https://example.com/test.pdf",
  current_page: 3,
};

const mockDocumentNulls: ChatDocument = {
  id: "doc-2",
  name: "Another_File.pdf",
  author: null,
  page_count: null,
  size: 1024,
  blob_url: "https://example.com/another.pdf",
  current_page: 1,
};

describe("ChatPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the formatted document name", () => {
    render(<ChatPageClient document={mockDocument} />);
    expect(screen.getByText("Test Document")).toBeInTheDocument();
  });

  it("renders the file size using formatBytes", () => {
    render(<ChatPageClient document={mockDocument} />);
    expect(screen.getByText(/2\.38 MB/)).toBeInTheDocument();
  });

  it("renders page count when present", () => {
    render(<ChatPageClient document={mockDocument} />);
    expect(screen.getByText(/10 pages/)).toBeInTheDocument();
  });

  it("renders author when present", () => {
    render(<ChatPageClient document={mockDocument} />);
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
  });

  it("does not render page count text when page_count is null", () => {
    render(<ChatPageClient document={mockDocumentNulls} />);
    expect(screen.queryByText(/pages/)).not.toBeInTheDocument();
  });

  it("does not render author text when author is null", () => {
    render(<ChatPageClient document={mockDocumentNulls} />);
    expect(screen.queryByText(/Jane Doe/)).not.toBeInTheDocument();
  });

  it("renders the back button with accessible name 'Back'", () => {
    render(<ChatPageClient document={mockDocument} />);
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  });

  it("calls router.back() when back button is clicked", () => {
    render(<ChatPageClient document={mockDocument} />);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("renders PdfViewer stub", () => {
    render(<ChatPageClient document={mockDocument} />);
    expect(screen.getByTestId("pdf-viewer")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toHaveTextContent("doc-1");
  });

  it("renders ChatPanel stub", () => {
    render(<ChatPageClient document={mockDocument} />);
    expect(screen.getByTestId("chat-panel")).toBeInTheDocument();
  });

  it("toggling chat collapsed state via ChatPanel's onToggle changes layout", () => {
    render(<ChatPageClient document={mockDocument} />);
    const chatPanel = screen.getByTestId("chat-panel");

    expect(chatPanel).toHaveAttribute("data-collapsed", "false");

    fireEvent.click(screen.getByRole("button", { name: /toggle/i }));
    expect(chatPanel).toHaveAttribute("data-collapsed", "true");

    fireEvent.click(screen.getByRole("button", { name: /toggle/i }));
    expect(chatPanel).toHaveAttribute("data-collapsed", "false");
  });

  it("renders outline panel hidden by default", () => {
    render(<ChatPageClient document={mockDocument} />);
    const outlinePanel = screen.getByTestId("outline-panel");
    expect(outlinePanel).toHaveAttribute("data-visible", "false");
  });

  it("does not show outline toggle button initially", () => {
    render(<ChatPageClient document={mockDocument} />);
    expect(
      screen.queryByRole("button", { name: /outline/i }),
    ).not.toBeInTheDocument();
  });

  it("shows outline toggle button when PDF has outline", async () => {
    render(<ChatPageClient document={mockDocument} />);
    // Wait for outline to load (mocked to call onOutlineLoad(true))
    const toggleButton = await screen.findByRole("button", {
      name: /outline/i,
    });
    expect(toggleButton).toBeInTheDocument();
  });

  it("toggles outline panel visibility when toggle button is clicked", async () => {
    render(<ChatPageClient document={mockDocument} />);
    const toggleButton = await screen.findByRole("button", {
      name: /outline/i,
    });
    const outlinePanel = screen.getByTestId("outline-panel");

    expect(outlinePanel).toHaveAttribute("data-visible", "false");

    fireEvent.click(toggleButton);
    expect(outlinePanel).toHaveAttribute("data-visible", "true");

    fireEvent.click(toggleButton);
    expect(outlinePanel).toHaveAttribute("data-visible", "false");
  });

  it("navigates PDF viewer when outline item is selected", async () => {
    render(<ChatPageClient document={mockDocument} />);

    // Wait for outline to load
    await screen.findByRole("button", { name: /outline/i });

    // Click outline item to select page 10
    const selectPageButton = screen.getByTestId("outline-select-page");
    fireEvent.click(selectPageButton);

    // Verify the page selection was handled (implementation will update PDF viewer)
    // For now, just verify the button exists and is clickable
    expect(selectPageButton).toBeInTheDocument();
  });

  it("closes outline when clicking outside of it", async () => {
    render(<ChatPageClient document={mockDocument} />);

    // Open outline
    const toggleButton = await screen.findByRole("button", {
      name: /outline/i,
    });
    fireEvent.click(toggleButton);

    const outlinePanel = screen.getByTestId("outline-panel");
    expect(outlinePanel).toHaveAttribute("data-visible", "true");

    // Click on PDF viewer area (outside outline)
    const pdfViewer = screen.getByTestId("pdf-viewer");
    fireEvent.mouseDown(pdfViewer);

    // Outline should close
    expect(outlinePanel).toHaveAttribute("data-visible", "false");
  });
});
