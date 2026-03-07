import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { SignOutButton } from "./sign-out-button";

// Mock next/navigation
const mockPush = vi.hoisted(() => vi.fn());
const mockRefresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock supabase client
const mockSignOut = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}));

// Mock sonner
const mockToastError = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({
  toast: {
    error: mockToastError,
    success: mockToastSuccess,
  },
}));

describe("SignOutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders sign out button with accessible name "Sign out"', () => {
    render(<SignOutButton />);
    expect(
      screen.getByRole("button", { name: /sign out/i }),
    ).toBeInTheDocument();
  });

  it("calls supabase.auth.signOut on click", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });

  it("on successful sign out: shows success toast, navigates to /login, calls router.refresh", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("Signed out successfully.");
      expect(mockPush).toHaveBeenCalledWith("/login");
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it("on signOut error: shows error toast, does NOT navigate", async () => {
    mockSignOut.mockResolvedValue({ error: new Error("sign out failed") });
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to sign out. Please try again.",
      );
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("on signOut exception: shows error toast", async () => {
    mockSignOut.mockRejectedValue(new Error("network error"));
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to sign out. Please try again.",
      );
    });
  });
});
