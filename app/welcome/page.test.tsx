import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import WelcomePage from "./page";

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

describe("WelcomePage", () => {
  it("renders the main heading", () => {
    render(<WelcomePage />);
    expect(
      screen.getByRole("heading", { name: /welcome to sanctuary/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders all feature cards", () => {
    render(<WelcomePage />);
    expect(screen.getAllByText(/read your books/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/chat with ai/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/build your library/i).length).toBeGreaterThan(
      0,
    );
  });

  it("renders the how-to sections", () => {
    render(<WelcomePage />);
    expect(screen.getAllByText(/how to upload/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/how to read/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/how to chat/i).length).toBeGreaterThan(0);
  });

  it("renders call-to-action buttons", () => {
    render(<WelcomePage />);
    const dashboardLinks = screen.getAllByRole("link", {
      name: /go to dashboard/i,
    });
    expect(dashboardLinks.length).toBeGreaterThan(0);

    const libraryLinks = screen.getAllByRole("link", {
      name: /view your library/i,
    });
    expect(libraryLinks.length).toBeGreaterThan(0);
  });
});
