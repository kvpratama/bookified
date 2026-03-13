import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LibraryPage, { metadata } from "./page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/library",
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
    name: "OnlyBook1.pdf",
    size: 1000,
    upload_date: "2026-03-05T10:00:00Z",
    author: "Author 1",
    page_count: 100,
    current_page: 35,
    thumbnail_url: null,
    blob_url: "https://example.com/test1.pdf",
    last_accessed: "2026-03-05T12:00:00Z",
    user_id: "user-1",
  },
  {
    id: "test-2",
    name: "Test Book 2.pdf",
    size: 2000,
    upload_date: "2026-03-06T10:00:00Z",
    author: "Author 2",
    page_count: 200,
    current_page: 50,
    thumbnail_url: null,
    blob_url: "https://example.com/test2.pdf",
    last_accessed: "2026-03-06T12:00:00Z",
    user_id: "user-1",
  },
];

// Mock Supabase client
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockIlike = vi.fn();
const mockOr = vi.fn();
const mockFrom = vi.fn();

let mockData: typeof mockDocuments | null = mockDocuments;
let mockCount: number = 2;
let mockError: Error | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: mockFrom,
  })),
}));

vi.mock("../_components/BookCard", () => ({
  BookCard: ({ doc }: { doc: { name: string } }) => (
    <div data-testid="book-card">{doc.name}</div>
  ),
}));

vi.mock("./search-input", () => ({
  SearchInput: ({ defaultValue }: { defaultValue?: string }) => (
    <input
      placeholder="Search by title or author..."
      defaultValue={defaultValue}
      data-testid="search-input"
    />
  ),
}));

describe("LibraryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData = mockDocuments;
    mockCount = mockDocuments.length;
    mockError = null;

    // Create a mock promise/builder that supports chaining
    const mockBuilder = {
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((resolve) => {
        return resolve({ data: mockData, error: mockError, count: mockCount });
      }),
    };

    mockRange.mockReturnValue(mockBuilder);
    mockOrder.mockReturnValue(mockBuilder);
    mockIlike.mockReturnValue(mockBuilder);
    mockOr.mockReturnValue(mockBuilder);
    mockSelect.mockReturnValue({
      order: mockOrder,
      range: mockRange,
      ilike: mockIlike,
      or: mockOr,
    });
    mockFrom.mockReturnValue({ select: mockSelect });

    // Ensure mockOrder returns something that has range/ilike/or
    mockOrder.mockReturnValue({
      order: mockOrder,
      range: mockRange,
      ilike: mockIlike,
      or: mockOr,
      then: mockBuilder.then,
    });
    mockRange.mockReturnValue({
      order: mockOrder,
      range: mockRange,
      ilike: mockIlike,
      or: mockOr,
      then: mockBuilder.then,
    });
    mockIlike.mockReturnValue({
      order: mockOrder,
      range: mockRange,
      ilike: mockIlike,
      or: mockOr,
      then: mockBuilder.then,
    });
    mockOr.mockReturnValue({
      order: mockOrder,
      range: mockRange,
      ilike: mockIlike,
      or: mockOr,
      then: mockBuilder.then,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("has the correct metadata", () => {
    expect(metadata.title).toBe("Your Library | Bookified");
  });

  it('renders the "Your Library" heading', async () => {
    const Page = await LibraryPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(
      screen.getByRole("heading", { name: /your library/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it("displays the correct counts", async () => {
    const Page = await LibraryPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(
      screen.getAllByText(/2 books in your collection/i)[0],
    ).toBeInTheDocument();
    expect(screen.getAllByText(/showing 1-2 of 2/i)[0]).toBeInTheDocument();
  });

  it("renders the book cards", async () => {
    const Page = await LibraryPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(screen.getAllByTestId("book-card").length).toBe(2);
    expect(screen.getByText("OnlyBook1.pdf")).toBeInTheDocument();
    expect(screen.getByText("Test Book 2.pdf")).toBeInTheDocument();
  });

  it("shows search input when books are present", async () => {
    const Page = await LibraryPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(
      screen.getAllByPlaceholderText(/search by title or author/i)[0],
    ).toBeInTheDocument();
  });

  it("shows search input when no books found", async () => {
    mockData = [];
    mockCount = 0;

    const Page = await LibraryPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(
      screen.getAllByPlaceholderText(/search by title or author/i)[0],
    ).toBeInTheDocument();
  });

  it("shows search input when search returns no results", async () => {
    mockData = [];
    mockCount = 0;

    const Page = await LibraryPage({
      searchParams: Promise.resolve({ q: "nonexistent" }),
    });
    render(Page);
    expect(
      screen.getAllByPlaceholderText(/search by title or author/i)[0],
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no books found matching "nonexistent"/i),
    ).toBeInTheDocument();
  });

  it("filters results when a search query is provided", async () => {
    mockData = [mockDocuments[0]];
    mockCount = 1;

    const Page = await LibraryPage({
      searchParams: Promise.resolve({ q: "OnlyBook1" }),
    });
    render(Page);

    expect(mockOr).toHaveBeenCalledWith(
      "name.ilike.%OnlyBook1%,author.ilike.%OnlyBook1%",
    );
    expect(
      screen.getByText(/1 book matching "OnlyBook1"/i),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("book-card")[0]).toHaveTextContent(
      "OnlyBook1.pdf",
    );
    expect(screen.queryAllByText("Test Book 2.pdf").length).toBe(0);
  });

  it("filters results when searching by author name", async () => {
    mockData = [mockDocuments[1]];
    mockCount = 1;

    const Page = await LibraryPage({
      searchParams: Promise.resolve({ q: "Author 2" }),
    });
    render(Page);

    expect(mockOr).toHaveBeenCalledWith(
      "name.ilike.%Author 2%,author.ilike.%Author 2%",
    );
    expect(screen.getByText(/1 book matching "Author 2"/i)).toBeInTheDocument();
  });

  it("shows empty state when no books found", async () => {
    mockData = [];
    mockCount = 0;

    const Page = await LibraryPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(
      screen.getByText(/no books found in your library/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByPlaceholderText(/search by title or author/i)[0],
    ).toBeInTheDocument();
  });

  it("shows pagination controls when multiple pages exist", async () => {
    mockCount = 10; // 8 per page
    const Page = await LibraryPage({
      searchParams: Promise.resolve({ page: "1" }),
    });
    render(Page);

    expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /next page/i }),
    ).toBeInTheDocument();
  });
});
