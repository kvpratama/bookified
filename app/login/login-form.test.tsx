import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { LoginForm } from "./login-form";

// Mock supabase client
const mockSignInWithOtp = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
    },
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders email step with email input and submit button", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue to sanctuary/i }),
    ).toBeInTheDocument();
  });

  it("shows loading state when submitting email", async () => {
    mockSignInWithOtp.mockReturnValue(new Promise(() => {}));
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue to sanctuary/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /preparing entrance/i }),
      ).toBeDisabled();
    });
  });

  it("transitions to sent step after successful magic link send", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue to sanctuary/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
      expect(
        screen.getByText(/open the email and click the link to continue/i),
      ).toBeInTheDocument();
    });
  });

  it("shows error message when magic link send fails", async () => {
    mockSignInWithOtp.mockResolvedValue({
      error: { message: "Rate limit exceeded" },
    });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue to sanctuary/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Unable to complete request. Please try again.",
      );
    });
  });

  it("passes emailRedirectTo with callback URL", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    render(<LoginForm next="/chat/abc" />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue to sanctuary/i }),
    );

    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        options: {
          shouldCreateUser: true,
          emailRedirectTo: expect.stringContaining(
            "/auth/callback?next=%2Fchat%2Fabc",
          ),
        },
      });
    });
  });

  it('"Use a different email" button goes back to email step', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue to sanctuary/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /use a different email/i }),
    );

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue to sanctuary/i }),
    ).toBeInTheDocument();
  });

  it("displays callback error when callbackError prop is provided", () => {
    render(<LoginForm callbackError="auth_failed" />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Authentication failed. Please try again.",
    );
  });
});
