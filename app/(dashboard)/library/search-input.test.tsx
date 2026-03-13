import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SearchInput } from "./search-input";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}));

describe("SearchInput", () => {
  const mockPush = vi.fn();
  const mockPathname = "/library";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(usePathname).mockReturnValue(mockPathname);
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn().mockReturnValue(""),
      toString: vi.fn().mockReturnValue(""),
    } as unknown as ReturnType<typeof useSearchParams>);
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders with default value", () => {
    render(<SearchInput defaultValue="test query" />);
    expect(screen.getByPlaceholderText(/Search your library/i)).toHaveValue(
      "test query",
    );
  });

  it("updates local state immediately but debounces router.push", async () => {
    render(<SearchInput />);
    const input = screen.getByPlaceholderText(/Search your library/i);

    fireEvent.change(input, { target: { value: "new search" } });
    expect(input).toHaveValue("new search");

    // Should not have called push yet
    expect(mockPush).not.toHaveBeenCalled();

    // Fast-forward debounce time
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("q=new+search"),
    );
  });

  it("clears input and focuses when clear button is clicked", () => {
    render(<SearchInput defaultValue="something" />);
    const clearButton = screen.getByRole("button", { name: /clear search/i });
    const input = screen.getByPlaceholderText(/Search your library/i);

    fireEvent.click(clearButton);
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });

  it("focuses input when '/' key is pressed", () => {
    render(<SearchInput />);
    const input = screen.getByPlaceholderText(/Search your library/i);

    expect(input).not.toHaveFocus();

    fireEvent.keyDown(window, { key: "/" });
    expect(input).toHaveFocus();
  });

  it("syncs with external defaultValue changes", () => {
    const { rerender } = render(<SearchInput defaultValue="initial" />);
    const input = screen.getByPlaceholderText(/Search your library/i);
    expect(input).toHaveValue("initial");

    rerender(<SearchInput defaultValue="updated" />);
    expect(input).toHaveValue("updated");
  });
});
