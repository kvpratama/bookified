"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/lib/hooks/use-debounce";

export function SearchInput({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [value, setValue] = useState(defaultValue);
  const debouncedValue = useDebounce(value, 300);

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
    // Only update the URL if the value has actually changed to avoid unnecessary navigation
    const currentQuery = searchParams.get("q") || "";
    if (debouncedValue !== currentQuery) {
      router.push(`${pathname}?${createQueryString("q", debouncedValue)}`);
    }
  }, [debouncedValue, pathname, router, createQueryString, searchParams]);

  return (
    <div className="relative flex-1 w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search your library..."
        className="w-full pl-10 pr-10 py-5 bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-ring shadow-none text-[15px] placeholder:text-muted-foreground rounded-md"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setValue("")}
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  );
}
