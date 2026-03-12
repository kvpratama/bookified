import Link from "next/link";
import { format } from "date-fns";
import { Search, Filter, LayoutGrid, List, Upload, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ContinueReading } from "@/components/dashboard/ContinueReading";
import { createClient } from "@/lib/supabase/server";
import { getBlobUrl, formatDocumentName } from "@/lib/utils";
import Image from "next/image";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: documents, error } = await supabase
    .from("documents")
    .select("*")
    .order("last_accessed", { ascending: false, nullsFirst: false })
    .order("upload_date", { ascending: false });

  if (error) {
    throw new Error("Failed to load your library. Please try again later.");
  }

  const bookCount = documents.length;

  const lastOpenedBook = documents[0] ?? null;

  return (
    <div className="flex flex-col min-h-screen max-w-7xl mx-auto w-full px-4 sm:px-6 py-12">
      {/* Title Area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4 border-b border-border pb-8">
        <div>
          <h1 className="text-5xl font-serif text-foreground tracking-tight">
            Your Library
          </h1>
          <p className="text-muted-foreground text-[15px] mt-4 font-medium">
            {bookCount} {bookCount === 1 ? "book" : "books"} in your collection
          </p>
        </div>

        <Button asChild size="lg">
          <Link href="/upload">
            <Upload className="w-4 h-4" />
            Upload Book
          </Link>
        </Button>
      </div>

      {documents.length === 0 ? (
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
          <div className="mb-6">
            <h2 className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">
              Currently Reading
            </h2>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10 mb-16">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/chat/${doc.id}`}
                className="group cursor-pointer flex flex-col text-left"
              >
                {/* Cover Image Placeholder */}
                <div className="relative aspect-3/4 w-full bg-muted overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-300 mb-4">
                  {doc.thumbnail_url ? (
                    <Image
                      src={getBlobUrl(doc.thumbnail_url)}
                      alt={doc.name}
                      fill
                      unoptimized
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-primary/5 group-hover:scale-105 transition-transform duration-500 ease-out flex items-center justify-center p-6 text-center">
                      <span className="font-serif text-primary/40 text-lg leading-snug line-clamp-4">
                        {formatDocumentName(doc.name)}
                      </span>
                    </div>
                  )}
                  {/* Reading progress bar */}
                  {doc.page_count &&
                    doc.page_count > 0 &&
                    doc.current_page > 0 && (
                      <div
                        className="absolute bottom-0 left-0 h-1 bg-accent-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          width: `${Math.round((doc.current_page / doc.page_count) * 100)}%`,
                        }}
                      />
                    )}
                </div>

                {/* Text Meta */}
                <div className="flex flex-col">
                  <h3 className="font-serif text-[17px] text-foreground leading-snug mb-1 line-clamp-1 group-hover:text-accent-foreground transition-colors">
                    {formatDocumentName(doc.name)}
                  </h3>
                  <p className="text-[13px] text-muted-foreground mb-3 line-clamp-1">
                    {doc.author || "Unknown Author"}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {doc.last_accessed
                        ? format(new Date(doc.last_accessed), "MMM d")
                        : format(new Date(doc.upload_date), "MMM d")}
                    </span>
                    {doc.page_count && <span>{doc.page_count} pages</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
