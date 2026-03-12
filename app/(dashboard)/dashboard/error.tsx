"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 max-w-md mx-auto w-full text-center">
      <div className="flex justify-center mb-6">
        <div className="p-3 bg-destructive/10 rounded-full">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
      </div>
      <h2 className="text-2xl font-serif text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-muted-foreground mb-8">
        We encountered an unexpected error loading your dashboard. Please try
        again.
      </p>
      <Button onClick={() => reset()} className="gap-2">
        <RefreshCcw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
