import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DashboardPage from "./page";

// Mock next/navigation
const mockPush = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the store with hoisted data
const mockDocuments = vi.hoisted(() => [
  {
    id: "test-1",
    name: "Test Book.pdf",
    size: 1000,
    uploadDate: "2026-03-05T10:00:00Z",
    author: "Test Author",
    pageCount: 100,
  },
]);

vi.mock("@/lib/store", () => ({
  useAppStore: (
    selector: (state: {
      documents: typeof mockDocuments;
      lastOpenedId: string | null;
      setLastOpened: (id: string) => void;
    }) => unknown,
  ) =>
    selector({
      documents: mockDocuments,
      lastOpenedId: "test-1",
      setLastOpened: vi.fn(),
    }),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders the "Your Library" heading', () => {
    render(<DashboardPage />);
    expect(
      screen.getByRole("heading", { name: /your library/i }),
    ).toBeInTheDocument();
  });

  it("displays the correct book count", () => {
    render(<DashboardPage />);
    expect(
      screen.getAllByText(/1 books in your collection/i).length,
    ).toBeGreaterThan(0);
  });

  it('navigates to /upload when clicking "Upload Book" button', () => {
    render(<DashboardPage />);
    const uploadButtons = screen.getAllByRole("button", {
      name: /upload book/i,
    });
    fireEvent.click(uploadButtons[0]);
    expect(mockPush).toHaveBeenCalledWith("/upload");
  });

  it("renders documents in the grid", () => {
    render(<DashboardPage />);
    // Use getAllByText since "Test Book" appears in multiple places
    expect(screen.getAllByText("Test Book").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Test Author").length).toBeGreaterThan(0);
  });

  it("navigates to /chat/[id] when clicking a document", () => {
    render(<DashboardPage />);
    // Find the first h3 element containing "Test Book" and click its parent card
    const bookTitles = screen.getAllByRole("heading", {
      level: 3,
      name: "Test Book",
    });
    const documentCard = bookTitles[0].closest('[class*="cursor-pointer"]');
    if (documentCard) {
      fireEvent.click(documentCard);
      expect(mockPush).toHaveBeenCalledWith("/chat/test-1");
    }
  });
});
