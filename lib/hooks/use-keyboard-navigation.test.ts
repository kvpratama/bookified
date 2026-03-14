import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useKeyboardNavigation } from "./use-keyboard-navigation";

describe("useKeyboardNavigation", () => {
  it("calls onLeft when ArrowLeft is pressed", () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();

    renderHook(() => useKeyboardNavigation({ onLeft, onRight }));

    const event = new KeyboardEvent("keydown", { key: "ArrowLeft" });
    window.dispatchEvent(event);

    expect(onLeft).toHaveBeenCalledTimes(1);
    expect(onRight).not.toHaveBeenCalled();
  });

  it("calls onRight when ArrowRight is pressed", () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();

    renderHook(() => useKeyboardNavigation({ onLeft, onRight }));

    const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
    window.dispatchEvent(event);

    expect(onRight).toHaveBeenCalledTimes(1);
    expect(onLeft).not.toHaveBeenCalled();
  });

  it("does not call handlers when input is focused", () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useKeyboardNavigation({ onLeft, onRight }));

    const event = new KeyboardEvent("keydown", { key: "ArrowLeft" });
    window.dispatchEvent(event);

    expect(onLeft).not.toHaveBeenCalled();
    expect(onRight).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("does not call handlers when textarea is focused", () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.focus();

    renderHook(() => useKeyboardNavigation({ onLeft, onRight }));

    const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
    window.dispatchEvent(event);

    expect(onLeft).not.toHaveBeenCalled();
    expect(onRight).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it("cleans up event listener on unmount", () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();

    const { unmount } = renderHook(() =>
      useKeyboardNavigation({ onLeft, onRight }),
    );

    unmount();

    const event = new KeyboardEvent("keydown", { key: "ArrowLeft" });
    window.dispatchEvent(event);

    expect(onLeft).not.toHaveBeenCalled();
  });
});
