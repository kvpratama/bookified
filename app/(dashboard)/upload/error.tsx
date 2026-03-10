"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UploadError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Upload route error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 max-w-2xl mx-auto w-full">
      <Card className="w-full shadow-sm border-destructive/20 bg-destructive/5">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-serif text-foreground">
            Something went wrong
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            An unexpected error occurred while handling your document. This
            might be due to a corrupted PDF or a temporary connection issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-0">
          <div className="bg-background/50 rounded-md p-3 text-xs font-mono text-muted-foreground break-all border border-border/50">
            Error ID: {error.digest || "unknown"}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
          <Button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
