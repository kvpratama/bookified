import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ChatError from "./error";

describe("ChatError", () => {
  const mockReset = vi.fn();
  const mockError = new Error("Test error");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders "Something went wrong" heading', () => {
    render(<ChatError error={mockError} reset={mockReset} />);
    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
  });

  it("renders the error description text", () => {
    render(<ChatError error={mockError} reset={mockReset} />);
    expect(
      screen.getByText(
        /unable to load the chat session\. please try again later\./i,
      ),
    ).toBeInTheDocument();
  });

  it('renders a "Try again" button', () => {
    render(<ChatError error={mockError} reset={mockReset} />);
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("calls reset when clicking the Try again button", () => {
    render(<ChatError error={mockError} reset={mockReset} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
