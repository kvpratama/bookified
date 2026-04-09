import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LandingFeatures } from "./landing-features";

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

describe("LandingFeatures", () => {
  it("renders the section heading", () => {
    render(<LandingFeatures />);
    expect(
      screen.getByRole("heading", {
        name: /everything you need to read smarter/i,
        level: 2,
      }),
    ).toBeInTheDocument();
  });

  it("renders all feature cards", () => {
    render(<LandingFeatures />);
    expect(screen.getAllByText(/read your books/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/chat with ai/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/build your library/i).length).toBeGreaterThan(
      0,
    );
  });

  it("renders the how-to sections", () => {
    render(<LandingFeatures />);
    expect(screen.getAllByText(/how to upload/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/how to read/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/how to chat/i).length).toBeGreaterThan(0);
  });

  it("renders call-to-action buttons", () => {
    render(<LandingFeatures />);
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
