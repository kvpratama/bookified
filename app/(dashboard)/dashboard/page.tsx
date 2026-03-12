import Link from "next/link";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ContinueReading } from "./_components/ContinueReading";
import { BookCard } from "../_components/BookCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Sanctuary",
  description: "Your reading sanctuary overview.",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: documents, error } = await supabase
    .from("documents")
    .select("*")
    .order("last_accessed", { ascending: false, nullsFirst: false })
    .order("upload_date", { ascending: false })
    .limit(4);

  if (error) {
    throw new Error("Failed to load your library. Please try again later.");
  }

  const lastOpenedBook =
    documents && documents.length > 0 ? documents[0] : null;

  return (
    <div className="flex flex-col min-h-screen max-w-7xl mx-auto w-full px-4 sm:px-6 py-12">
      {/* Title Area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4 border-b border-border pb-8">
        <div>
          <h1 className="text-5xl font-serif text-foreground tracking-tight">
            Sanctuary
          </h1>
          <p className="text-muted-foreground text-[15px] mt-4 font-medium">
            Welcome back to your reading room.
          </p>
        </div>

        <Button asChild size="lg">
          <Link href="/upload">
            <Upload className="w-4 h-4" />
            Upload Book
          </Link>
        </Button>
      </div>

      {!documents || documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground mt-1 mb-6">
            No books found in your library.
          </p>
          <Button asChild>
            <Link href="/upload">
              <Upload className="w-4 h-4" />
              Upload Book
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Continue Reading Section */}
          {lastOpenedBook && (
            <div className="mb-12">
              <ContinueReading document={lastOpenedBook} />
            </div>
          )}

          {/* Section Heading */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">
              Recently Accessed
            </h2>
            <Button
              asChild
              variant="link"
              size="sm"
              className="text-muted-foreground hover:text-foreground p-0 h-auto"
            >
              <Link href="/library">View Library</Link>
            </Button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10 mb-16">
            {documents.map((doc) => (
              <BookCard key={doc.id} doc={doc} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
