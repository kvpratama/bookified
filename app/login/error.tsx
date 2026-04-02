"use client";

import { Button } from "@/components/ui/button";

export default function LoginError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <h2 className="text-xl font-serif text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        Unable to load the login page. Please try again later.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
