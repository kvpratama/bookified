import { useEffect } from "react";

type UseKeyboardNavigationProps = {
  onLeft: () => void;
  onRight: () => void;
};

export function useKeyboardNavigation({
  onLeft,
  onRight,
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      if (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        onLeft();
      } else if (e.key === "ArrowRight") {
        onRight();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onLeft, onRight]);
}
