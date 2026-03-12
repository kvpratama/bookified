import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

let mockData: typeof mockDocuments | null = mockDocuments;
let mockError: Error | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    from: mockFrom,
  })),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData = mockDocuments;
    mockError = null;

    // Create a mock promise/builder that supports chaining
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
    expect(screen.getAllByText("Test Book").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Test Author").length).toBeGreaterThan(0);
  });

  it("shows empty state when no documents exist", async () => {
    mockData = [];

    const Page = await DashboardPage();
    render(Page);
    expect(
      screen.getByText("No books found in your library."),
    ).toBeInTheDocument();
  });

  it("throws when Supabase returns an error", async () => {
    mockData = null;
    mockError = new Error("DB error");

    await expect(DashboardPage()).rejects.toThrow(
      "Failed to load your library. Please try again later.",
    );
  });
});
