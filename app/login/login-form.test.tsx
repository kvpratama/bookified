import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { LoginForm } from "./login-form";

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
const mockSignInWithOtp = vi.hoisted(() => vi.fn());
const mockVerifyOtp = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
      verifyOtp: mockVerifyOtp,
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

  it("transitions to OTP step after successful OTP send", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue to sanctuary/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /verify & enter/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows error message when OTP send fails", async () => {
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
        "Rate limit exceeded",
      );
    });
  });

  it("shows OTP input and verify button on OTP step", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue to sanctuary/i }),
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("000000")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /verify & enter/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows error message when OTP verify fails", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    mockVerifyOtp.mockResolvedValue({
      error: { message: "Invalid OTP" },
    });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue to sanctuary/i }),
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("000000")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("000000"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify & enter/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid OTP");
    });
  });

  it("navigates to /dashboard on successful OTP verify (default redirect)", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    mockVerifyOtp.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue to sanctuary/i }),
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("000000")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("000000"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify & enter/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("navigates to custom next path on successful OTP verify", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    mockVerifyOtp.mockResolvedValue({ error: null });
    render(<LoginForm next="/chat/abc" />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue to sanctuary/i }),
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("000000")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("000000"), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify & enter/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/chat/abc");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('"Return to Entry" button goes back to email step and clears OTP/error', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    mockVerifyOtp.mockResolvedValue({
      error: { message: "Invalid OTP" },
    });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue to sanctuary/i }),
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("000000")).toBeInTheDocument();
    });

    // Submit an invalid OTP to produce an error
    fireEvent.change(screen.getByPlaceholderText("000000"), {
      target: { value: "999999" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify & enter/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid OTP");
    });

    // Click "Return to Entry"
    fireEvent.click(screen.getByRole("button", { name: /return to entry/i }));

    // Should be back on email step
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue to sanctuary/i }),
    ).toBeInTheDocument();
    // Error should be cleared
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("OTP input only accepts numeric characters", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue to sanctuary/i }),
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("000000")).toBeInTheDocument();
    });

    const otpInput = screen.getByPlaceholderText("000000");

    fireEvent.change(otpInput, { target: { value: "12ab34" } });
    expect(otpInput).toHaveValue("1234");

    fireEvent.change(otpInput, { target: { value: "abcdef" } });
    expect(otpInput).toHaveValue("");

    fireEvent.change(otpInput, { target: { value: "567890" } });
    expect(otpInput).toHaveValue("567890");
  });
});
