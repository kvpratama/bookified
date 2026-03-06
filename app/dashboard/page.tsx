"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search, Filter, LayoutGrid, List, Upload, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { ContinueReading } from "@/components/dashboard/ContinueReading";

export default function DashboardPage() {
  const router = useRouter();
  const documents = useAppStore((state) => state.documents);
  const lastOpenedId = useAppStore((state) => state.lastOpenedId);
  const setLastOpened = useAppStore((state) => state.setLastOpened);

  const bookCount = documents.length;
  const lastOpenedBook = documents.find((doc) => doc.id === lastOpenedId);

  return (
    <div className="flex flex-col min-h-screen max-w-7xl mx-auto w-full px-4 sm:px-6 py-12">
      {/* Title Area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4 border-b border-border pb-8">
        <div>
          <h1 className="text-5xl font-serif text-foreground tracking-tight">
            Your Library
          </h1>
          <p className="text-muted-foreground text-[15px] mt-4 font-medium">
            {bookCount} books in your collection
          </p>
        </div>

        <button
          onClick={() => router.push("/upload")}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-[15px] font-medium rounded shadow-sm hover:opacity-90 transition-opacity"
        >
          <Upload suppressHydrationWarning className="w-4 h-4" />
          Upload Book
        </button>
      </div>

      {/* Continue Reading Section */}
      {lastOpenedBook && (
        <div className="mb-12">
          <ContinueReading document={lastOpenedBook} />
        </div>
      )}

      {/* Action Bar */}
      <div
        suppressHydrationWarning
        className="flex flex-col sm:flex-row items-center gap-4 mb-12"
      >
        <div className="relative flex-1 w-full">
          <Search
            suppressHydrationWarning
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          />
          <Input
            placeholder="Search your library..."
            className="w-full pl-10 py-5 bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-ring shadow-none text-[15px] placeholder:text-muted-foreground rounded-md"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-foreground/70 font-medium text-[14px] rounded-md hover:bg-muted transition-colors">
            <Filter suppressHydrationWarning className="w-4 h-4" />
            Filter
          </button>

          <div className="flex items-center border border-border rounded-md p-0.5 bg-transparent">
            <button className="p-2 text-foreground/70 hover:bg-muted rounded-sm transition-colors bg-muted">
              <LayoutGrid suppressHydrationWarning className="w-4 h-4" />
            </button>
            <button className="p-2 text-foreground/40 hover:text-foreground/70 hover:bg-muted rounded-sm transition-colors">
              <List suppressHydrationWarning className="w-4 h-4" />
            </button>
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
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground mt-1 mb-6">
            No books found in your library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10 mb-16">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group cursor-pointer flex flex-col"
              onClick={() => {
                setLastOpened(doc.id);
                router.push(`/chat/${doc.id}`);
              }}
            >
              {/* Cover Image Placeholder */}
              <div className="relative aspect-3/4 w-full bg-muted overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-300 mb-4">
                {/* Fallback pattern / gradient if no image */}
                {doc.thumbnailUrl ? (
                  <img
                    src={doc.thumbnailUrl}
                    alt={doc.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-primary/5 group-hover:scale-105 transition-transform duration-500 ease-out flex items-center justify-center p-6 text-center">
                    <span className="font-serif text-primary/40 text-lg leading-snug line-clamp-4">
                      {doc.name.replace(".pdf", "").replace(/_/g, " ")}
                    </span>
                  </div>
                )}
                {/* Simulated reading progress bar */}
                <div className="absolute bottom-0 left-0 h-1 bg-accent-foreground w-[35%] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Text Meta */}
              <div className="flex flex-col">
                <h3 className="font-serif text-[17px] text-foreground leading-snug mb-1 line-clamp-1 group-hover:text-accent-foreground transition-colors">
                  {doc.name.replace(".pdf", "").replace(/_/g, " ")}
                </h3>
                <p className="text-[13px] text-muted-foreground mb-3 line-clamp-1">
                  {doc.author || "Unknown Author"}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock suppressHydrationWarning className="w-3 h-3" />
                    {format(new Date(doc.uploadDate), "MMM d")}
                  </span>
                  {doc.pageCount && <span>{doc.pageCount} pages</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
