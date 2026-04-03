import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { BookCard } from "./BookCard";
import type { Database } from "@/lib/supabase/database.types";

type Document = Database["public"]["Tables"]["documents"]["Row"];

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

const baseDoc: Document = {
  id: "test-id",
  user_id: "user-id",
  name: "Test Book.pdf",
  author: "Test Author",
  size: 1000,
  blob_url: "https://example.com/test.pdf",
  thumbnail_url: null,
  page_count: 100,
  current_page: 0,
  upload_date: "2026-03-20T10:00:00Z",
  last_accessed: "2026-03-25T10:00:00Z",
  ingested_at: null,
  is_ingesting: false,
};

describe("BookCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T11:18:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("renders book title and author", () => {
    render(<BookCard doc={baseDoc} />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Test Book",
    );
    expect(screen.getByText("Test Author")).toBeInTheDocument();
  });

  it("shows 'New' badge for unaccessed documents uploaded within 7 days", () => {
    const now = new Date("2026-04-02T11:18:00Z");
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const newDoc: Document = {
      ...baseDoc,
      upload_date: fiveDaysAgo.toISOString(),
      last_accessed: null,
    };

    render(<BookCard doc={newDoc} />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("does not show 'New' badge for documents uploaded more than 7 days ago", () => {
    const now = new Date("2026-04-02T11:18:00Z");
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

    const oldDoc: Document = {
      ...baseDoc,
      upload_date: eightDaysAgo.toISOString(),
      last_accessed: null,
    };

    render(<BookCard doc={oldDoc} />);
    expect(screen.queryByText("New")).not.toBeInTheDocument();
  });

  it("does not show 'New' badge for accessed documents even if recent", () => {
    const now = new Date("2026-04-02T11:18:00Z");
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const accessedDoc: Document = {
      ...baseDoc,
      upload_date: twoDaysAgo.toISOString(),
      last_accessed: now.toISOString(),
    };

    render(<BookCard doc={accessedDoc} />);
    expect(screen.queryByText("New")).not.toBeInTheDocument();
  });

  it("shows 'New' badge exactly at 7 day boundary", () => {
    const now = new Date("2026-04-02T11:18:00Z");
    const exactlySevenDaysAgo = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000,
    );

    const boundaryDoc: Document = {
      ...baseDoc,
      upload_date: exactlySevenDaysAgo.toISOString(),
      last_accessed: null,
    };

    render(<BookCard doc={boundaryDoc} />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });
});
