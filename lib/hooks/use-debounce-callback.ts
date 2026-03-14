import { useCallback, useRef, useEffect } from "react";

export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number = 1000,
): (...args: Args) => void {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const latestCallbackRef = useRef(callback);

  useEffect(() => {
    latestCallbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        latestCallbackRef.current(...args);
      }, delay);
    },
    [delay],
  );
}
