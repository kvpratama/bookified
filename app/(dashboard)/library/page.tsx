import Link from "next/link";
import { Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { BookCard } from "../_components/BookCard";
import { SearchInput } from "./search-input";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Your Library | Bookified",
  description: "Browse and manage your personal book collection.",
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q: query } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const limit = 8;
  const from = (page - 1) * limit;

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_sorted_documents", {
    search_query: query,
    limit_count: limit,
    offset_count: from,
  });

  if (error) {
    throw new Error("Failed to load your library. Please try again later.");
  }

  const documents = data || [];
  const totalCount = documents[0]?.total_count ?? 0;
  const totalPages = Math.ceil(Number(totalCount) / limit);
  const currentCount = documents.length;

  return (
    <div className="flex flex-col min-h-screen max-w-7xl mx-auto w-full px-4 sm:px-6 py-12">
      {/* Title Area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4 border-b border-border pb-8">
        <div>
          <h1 className="text-5xl font-serif text-foreground tracking-tight">
            Your Library
          </h1>
          <p className="text-muted-foreground text-[15px] mt-4 font-medium">
            {totalCount} {totalCount === 1 ? "book" : "books"}{" "}
            {query ? `matching "${query}"` : "in your collection"}
          </p>
        </div>

        <Button asChild size="lg">
          <Link href="/upload">
            <Upload className="w-4 h-4" />
            Upload Book
          </Link>
        </Button>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
        <Suspense
          fallback={
            <div className="relative flex-1 w-full h-[58px] bg-muted/50 rounded-md animate-pulse" />
          }
        >
          <SearchInput defaultValue={query} />
        </Suspense>
      </div>

      {!documents || documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground mt-1 mb-6">
            {query
              ? `No books found matching "${query}".`
              : page > 1
                ? "No more books to show."
                : "No books found in your library."}
          </p>
          {query || page > 1 ? (
            <Button asChild variant="outline">
              <Link href="/library">Clear filters</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/upload">
                <Upload className="w-4 h-4" />
                Upload Book
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Section Heading */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">
              {query ? `Search results for "${query}"` : "All Books"}
            </h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
              Showing {from + 1}-{from + currentCount} of {totalCount}
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10 mb-16">
            {documents.map((doc) => (
              <BookCard key={doc.id} doc={doc} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mb-16">
              <Button
                asChild
                variant="outline"
                size="icon"
                disabled={page <= 1}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              >
                <Link
                  href={`/library?${(() => {
                    const params = new URLSearchParams();
                    params.set("page", String(page - 1));
                    if (query) params.set("q", query);
                    return params.toString();
                  })()}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="sr-only">Previous Page</span>
                </Link>
              </Button>

              <div className="text-[13px] font-medium text-muted-foreground">
                Page {page} of {totalPages}
              </div>

              <Button
                asChild
                variant="outline"
                size="icon"
                disabled={page >= totalPages}
                className={
                  page >= totalPages ? "pointer-events-none opacity-50" : ""
                }
              >
                <Link
                  href={`/library?${(() => {
                    const params = new URLSearchParams();
                    params.set("page", String(page + 1));
                    if (query) params.set("q", query);
                    return params.toString();
                  })()}`}
                >
                  <ChevronRight className="w-4 h-4" />
                  <span className="sr-only">Next Page</span>
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
