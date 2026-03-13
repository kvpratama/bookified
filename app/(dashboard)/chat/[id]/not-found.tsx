import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Link from "next/link";

export default function ChatNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center p-4">
      <FileText className="w-12 h-12 text-muted-foreground mb-4" />
      <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
        Document not found
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        The document you are looking for doesn&apos;t exist or has been removed.
      </p>
      <Button asChild>
        <Link href="/dashboard">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
