"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useDebounce } from "@/lib/hooks/use-debounce";

export function SearchInput({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [value, setValue] = useState(defaultValue);
  const [prevDefault, setPrevDefault] = useState(defaultValue);
  const debouncedValue = useDebounce(value, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  // Reset input when query is cleared externally (e.g. "Clear filters")
  if (defaultValue !== prevDefault) {
    setPrevDefault(defaultValue);
    if (!defaultValue) {
      setValue("");
    }
  }

  // Keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      // Reset to first page when searching
      params.delete("page");
      return params.toString();
    },
    [searchParams],
  );

  useEffect(() => {
    const currentQuery = searchParams.get("q") || "";
    if (debouncedValue !== currentQuery) {
      startTransition(() => {
        router.push(`${pathname}?${createQueryString("q", debouncedValue)}`);
      });
    }
  }, [debouncedValue, pathname, router, createQueryString, searchParams]);

  return (
    <div className="relative flex-1 w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by title or author..."
        className={cn(
          "w-full pl-10 pr-10 py-5 bg-muted/50 border-transparent transition-all duration-200",
          "focus-visible:ring-1 focus-visible:ring-ring focus-visible:bg-background focus-visible:border-border",
          "shadow-none text-[15px] placeholder:text-muted-foreground rounded-md",
          isPending && "opacity-70",
        )}
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground transition-opacity duration-200"
          onClick={() => {
            setValue("");
            inputRef.current?.focus();
          }}
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  );
}
