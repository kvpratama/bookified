import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import ChatNotFound from "./not-found";

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

describe("ChatNotFound", () => {
  afterEach(() => {
    cleanup();
  });

  it('renders "Document not found" heading', () => {
    render(<ChatNotFound />);
    expect(
      screen.getByRole("heading", { name: /document not found/i }),
    ).toBeInTheDocument();
  });

  it("renders the descriptive text about document not existing", () => {
    render(<ChatNotFound />);
    expect(
      screen.getByText(
        /the document you are looking for doesn't exist or has been removed\./i,
      ),
    ).toBeInTheDocument();
  });

  it('renders a "Return to Dashboard" link pointing to /dashboard', () => {
    render(<ChatNotFound />);
    const link = screen.getByRole("link", { name: /return to dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/dashboard");
  });
});
