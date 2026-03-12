import Link from "next/link";
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { BookCard } from "@/components/dashboard/BookCard";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10));
  const limit = 8;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = await createClient();

  const {
    data: documents,
    error,
    count,
  } = await supabase
    .from("documents")
    .select("*", { count: "exact" })
    .order("last_accessed", { ascending: false, nullsFirst: false })
    .order("upload_date", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error("Failed to load your library. Please try again later.");
  }

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / limit);
  const currentCount = documents?.length ?? 0;

  return (
    <div className="flex flex-col min-h-screen max-w-7xl mx-auto w-full px-4 sm:px-6 py-12">
      {/* Title Area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4 border-b border-border pb-8">
        <div>
          <h1 className="text-5xl font-serif text-foreground tracking-tight">
            Your Library
          </h1>
          <p className="text-muted-foreground text-[15px] mt-4 font-medium">
            {totalCount} {totalCount === 1 ? "book" : "books"} in your
            collection
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
            {page > 1
              ? "No more books to show."
              : "No books found in your library."}
          </p>
          {page > 1 ? (
            <Button asChild variant="outline">
              <Link href="/library">Back to first page</Link>
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
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search your library..."
                className="w-full pl-10 py-5 bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-ring shadow-none text-[15px] placeholder:text-muted-foreground rounded-md"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button variant="outline">
                <Filter className="w-4 h-4" />
                Filter
              </Button>

              <div className="flex items-center border border-border rounded-md p-0.5 bg-transparent">
                <Button variant="ghost" size="icon-sm" className="bg-muted">
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-foreground/40 hover:text-foreground/70"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Section Heading */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">
              All Books
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
                <Link href={`/library?page=${page - 1}`}>
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
                <Link href={`/library?page=${page + 1}`}>
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
