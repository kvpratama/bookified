import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DashboardPage from "./page";

// Mock next/navigation (used by ContinueReading)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
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

// Mock data
const mockDocuments = [
  {
    id: "test-1",
    name: "Test Book.pdf",
    size: 1000,
    upload_date: "2026-03-05T10:00:00Z",
    author: "Test Author",
    page_count: 100,
    current_page: 35,
    thumbnail_url: null,
    blob_url: "https://example.com/test.pdf",
    last_accessed: "2026-03-05T12:00:00Z",
    user_id: "user-1",
  },
];

// Mock Supabase client
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn();

let mockData: typeof mockDocuments | null = mockDocuments;
let mockError: Error | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

vi.mock("./_components/ContinueReading", () => ({
  ContinueReading: () => <div data-testid="continue-reading" />,
}));

vi.mock("../_components/BookCard", () => ({
  BookCard: ({ doc }: { doc: { name: string } }) => (
    <div data-testid="book-card">{doc.name}</div>
  ),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData = mockDocuments;
    mockError = null;

    // Mock rpc for get_sorted_documents - returns data directly, not wrapped
    mockRpc.mockResolvedValue({ data: mockData, error: mockError });

    // Legacy mock setup for any .from() calls (not used by current implementation)
    const mockBuilder = {
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((resolve) => {
        return resolve({ data: mockData, error: mockError });
      }),
    };

    mockLimit.mockReturnValue(mockBuilder);
    mockOrder.mockReturnValue(mockBuilder);
    mockSelect.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });

    mockOrder.mockReturnValue({
      order: mockOrder,
      limit: mockLimit,
      then: mockBuilder.then,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the "Sanctuary" heading', async () => {
    const Page = await DashboardPage();
    render(Page);
    expect(
      screen.getByRole("heading", { name: /sanctuary/i }),
    ).toBeInTheDocument();
  });

  it("displays the welcome message", async () => {
    const Page = await DashboardPage();
    render(Page);
    expect(
      screen.getAllByText(/welcome back to your reading room/i)[0],
    ).toBeInTheDocument();
  });

  it('has an "Upload Book" link pointing to /upload', async () => {
    const Page = await DashboardPage();
    render(Page);
    const uploadLinks = screen.getAllByRole("link", {
      name: /upload book/i,
    });
    expect(uploadLinks[0]).toHaveAttribute("href", "/upload");
  });

  it("renders documents in the grid", async () => {
    const Page = await DashboardPage();
    render(Page);
    expect(screen.getAllByTestId("book-card").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Test Book.pdf").length).toBeGreaterThan(0);
  });

  it("shows empty state when no documents exist", async () => {
    mockData = [];
    mockRpc.mockResolvedValue({ data: [], error: null });

    const Page = await DashboardPage();
    render(Page);
    expect(
      screen.getByText("No books found in your library."),
    ).toBeInTheDocument();
  });

  it("throws when Supabase returns an error", async () => {
    mockError = new Error("DB error");
    mockRpc.mockResolvedValue({ data: null, error: mockError });

    await expect(DashboardPage()).rejects.toThrow(
      "Failed to load your library. Please try again later.",
    );
  });

  it("applies priority sorting with three-tier order", async () => {
    await DashboardPage();

    // Verify RPC was called with correct parameters
    expect(mockRpc).toHaveBeenCalledWith("get_sorted_documents", {
      search_query: undefined,
      limit_count: 4,
      offset_count: 0,
    });
  });
});
