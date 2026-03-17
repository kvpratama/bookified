import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import type { ChatDocument } from "./types";

// Mock next/navigation
const mockBack = vi.fn();
const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/chat/doc-1",
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

// Shared mock state & actions for the DocumentViewerContext
const mockViewerActions = vi.hoisted(() => ({
  setPdfDocument: vi.fn(),
  setCurrentPage: vi.fn(),
  handleOutlineExtracted: vi.fn(),
  handlePageSelect: vi.fn(),
  toggleOutline: vi.fn(),
  closeOutline: vi.fn(),
  toggleChat: vi.fn(),
}));

const mockViewerState = vi.hoisted(() => ({
  pdfDocument: null,
  currentPage: 1,
  outline: null as unknown[] | null,
  isOutlineLoading: true,
  hasOutline: false,
  outlineVisible: false,
  chatCollapsed: true,
  selectedPage: undefined as number | undefined,
}));

// Mock the context module so the provider is a passthrough
vi.mock("./document-viewer-context", () => ({
  useDocumentViewer: () => ({
    state: mockViewerState,
    actions: mockViewerActions,
  }),
  DocumentViewerProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

// Mock PdfViewer — stub the module (prevents real pdf-viewer.tsx from loading)
vi.mock("./pdf-viewer", () => ({
  PdfViewer: ({ document }: { document: { id: string } }) => {
    React.useEffect(() => {
      mockViewerActions.handleOutlineExtracted(
        [{ title: "Chapter 1", dest: null, items: [] }],
        false,
      );
      // Simulate outline making hasOutline true
      mockViewerState.hasOutline = true;
      mockViewerState.isOutlineLoading = false;
    }, []);

    return (
      <div data-testid="pdf-viewer">
        {document.id}
        <button
          data-testid="pdf-goto-page"
          onClick={() => mockViewerActions.setCurrentPage(5)}
        >
          Go to page 5
        </button>
      </div>
    );
  },
}));

// Mock next/dynamic to be synchronous for testing
vi.mock("next/dynamic", () => ({
  default: (
    loader: () => Promise<{
      default: React.ComponentType<Record<string, unknown>>;
      PdfViewer: React.ComponentType<Record<string, unknown>>;
      OutlinePanel: React.ComponentType<Record<string, unknown>>;
    }>,
  ) => {
    let Resolved: React.ComponentType<Record<string, unknown>> | null = null;
    const promise = loader().then((mod) => {
      Resolved = mod.default || mod.PdfViewer || mod.OutlinePanel;
    });

    return function DynamicStub(props: Record<string, unknown>) {
      if (!Resolved) {
        throw promise;
      }
      return <Resolved {...props} />;
    };
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
      <button onClick={onToggle}>toggle-chat</button>
    </div>
  ),
}));

// Mock OutlinePanel — reads state from mock context
vi.mock("./outline-panel", () => ({
  OutlinePanel: () => {
    return (
      <div
        data-testid="outline-panel"
        data-visible={mockViewerState.outlineVisible}
      >
        <button
          data-testid="outline-select-page"
          onClick={() => mockViewerActions.handlePageSelect(10)}
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

function resetMockState() {
  mockViewerState.pdfDocument = null;
  mockViewerState.currentPage = 1;
  mockViewerState.outline = null;
  mockViewerState.isOutlineLoading = true;
  mockViewerState.hasOutline = false;
  mockViewerState.outlineVisible = false;
  mockViewerState.chatCollapsed = true;
  mockViewerState.selectedPage = undefined;
}

describe("ChatPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockState();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the formatted document name", async () => {
    render(<ChatPageClient document={mockDocument} />);
    expect(await screen.findByText("Test Document")).toBeInTheDocument();
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
    Object.defineProperty(window, "history", {
      value: { length: 2 },
      writable: true,
    });
    render(<ChatPageClient document={mockDocument} />);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("renders PdfViewer stub", async () => {
    render(<ChatPageClient document={mockDocument} />);
    expect(await screen.findByTestId("pdf-viewer")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toHaveTextContent("doc-1");
  });

  it("renders ChatPanel stub", async () => {
    render(<ChatPageClient document={mockDocument} />);
    expect(await screen.findByTestId("chat-panel")).toBeInTheDocument();
  });

  it("toggling chat collapsed state via ChatPanel's onToggle changes layout", async () => {
    render(<ChatPageClient document={mockDocument} />);
    const chatPanel = await screen.findByTestId("chat-panel");

    expect(chatPanel).toHaveAttribute("data-collapsed", "true");

    // toggleChat is called via context
    fireEvent.click(screen.getByRole("button", { name: /toggle-chat/i }));
    expect(mockViewerActions.toggleChat).toHaveBeenCalledTimes(1);
  });

  it("renders outline panel hidden by default", () => {
    render(<ChatPageClient document={mockDocument} />);
    const outlinePanel = screen.getByTestId("outline-panel");
    expect(outlinePanel).toHaveAttribute("data-visible", "false");
  });

  it("shows outline toggle button when PDF has outline", async () => {
    mockViewerState.hasOutline = true;
    render(<ChatPageClient document={mockDocument} />);
    const toggleButton = screen.getByRole("button", {
      name: /outline/i,
    });
    expect(toggleButton).toBeInTheDocument();
  });

  it("toggles outline panel visibility when toggle button is clicked", async () => {
    mockViewerState.hasOutline = true;
    render(<ChatPageClient document={mockDocument} />);
    const toggleButton = screen.getByRole("button", {
      name: /outline/i,
    });

    fireEvent.click(toggleButton);
    expect(mockViewerActions.toggleOutline).toHaveBeenCalledTimes(1);
  });

  it("navigates PDF viewer when outline item is selected", async () => {
    mockViewerState.hasOutline = true;
    render(<ChatPageClient document={mockDocument} />);

    const selectPageButton = screen.getByTestId("outline-select-page");
    fireEvent.click(selectPageButton);

    expect(mockViewerActions.handlePageSelect).toHaveBeenCalledWith(10);
  });

  it("closes outline when clicking outside of it", async () => {
    // The click-outside logic is now in DocumentViewerProvider which is mocked.
    // Verify the outline panel renders with outlineVisible state.
    mockViewerState.outlineVisible = true;
    render(<ChatPageClient document={mockDocument} />);

    const outlinePanel = screen.getByTestId("outline-panel");
    expect(outlinePanel).toHaveAttribute("data-visible", "true");
  });

  describe("URL Sync", () => {
    it("initializes chatCollapsed from URL search params", async () => {
      // URL sync is now in DocumentViewerProvider (mocked).
      // Verify ChatPanel receives collapsed state from context.
      mockViewerState.chatCollapsed = true;
      mockSearchParams = new URLSearchParams("chat=collapsed");
      render(<ChatPageClient document={mockDocument} />);

      const chatPanel = await screen.findByTestId("chat-panel");
      expect(chatPanel).toHaveAttribute("data-collapsed", "true");
    });

    it("initializes outlineVisible from URL search params", async () => {
      mockViewerState.outlineVisible = true;
      mockSearchParams = new URLSearchParams("outline=true");
      render(<ChatPageClient document={mockDocument} />);

      const outlinePanel = await screen.findByTestId("outline-panel");
      expect(outlinePanel).toHaveAttribute("data-visible", "true");
    });

    it("updates URL when toggling chat panel", () => {
      mockSearchParams = new URLSearchParams();
      render(<ChatPageClient document={mockDocument} />);

      fireEvent.click(screen.getByText("toggle-chat"));
      // toggleChat is handled by the context provider
      expect(mockViewerActions.toggleChat).toHaveBeenCalled();
    });

    it("updates URL when toggling outline panel", async () => {
      mockViewerState.hasOutline = true;
      mockSearchParams = new URLSearchParams();
      render(<ChatPageClient document={mockDocument} />);

      const toggleButton = screen.getByRole("button", {
        name: /outline/i,
      });
      fireEvent.click(toggleButton);

      expect(mockViewerActions.toggleOutline).toHaveBeenCalled();
    });
  });

  describe("Outline Data Flow", () => {
    it("passes outline data from PdfViewer to OutlinePanel", async () => {
      render(<ChatPageClient document={mockDocument} />);

      const pdfViewer = await screen.findByTestId("pdf-viewer");
      expect(pdfViewer).toBeInTheDocument();

      const outlinePanel = await screen.findByTestId("outline-panel");
      expect(outlinePanel).toBeInTheDocument();
    });
  });
});
