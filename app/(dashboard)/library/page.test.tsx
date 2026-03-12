import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import LibraryPage from "./page";

// Mock next/navigation
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
    name: "Test Book 1.pdf",
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
const mockFrom = vi.fn();

let mockData: typeof mockDocuments | null = mockDocuments;
let mockCount: number = 2;
let mockError: Error | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: mockFrom,
  })),
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
      then: vi.fn().mockImplementation((resolve) => {
        return resolve({ data: mockData, error: mockError, count: mockCount });
      }),
    };

    mockRange.mockReturnValue(mockBuilder);
    mockOrder.mockReturnValue(mockBuilder);
    mockSelect.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });
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
    expect(screen.getAllByText(/Test Book 1/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Test Book 2/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Author 1/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Author 2/i)[0]).toBeInTheDocument();
  });

  it("shows search and filter controls", async () => {
    const Page = await LibraryPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(
      screen.getAllByPlaceholderText(/search your library/i)[0],
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /filter/i })[0],
    ).toBeInTheDocument();
  });

  it("shows empty state when no books found", async () => {
    mockData = [];
    mockCount = 0;

    const Page = await LibraryPage({ searchParams: Promise.resolve({}) });
    render(Page);
    expect(
      screen.getByText(/no books found in your library/i),
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

  it("calculates range correctly for page 2", async () => {
    mockCount = 10;
    await LibraryPage({ searchParams: Promise.resolve({ page: "2" }) });

    // page 2 with limit 8 should be range(8, 15)
    expect(mockOrder().range).toHaveBeenCalledWith(8, 15);
  });
});
