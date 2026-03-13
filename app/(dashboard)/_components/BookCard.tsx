import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { getBlobUrl, formatDocumentName } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";

type Document = Database["public"]["Tables"]["documents"]["Row"];

interface BookCardProps {
  doc: Document;
}

export function BookCard({ doc }: BookCardProps) {
  return (
    <Link
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
        {doc.page_count && doc.page_count > 0 && doc.current_page > 0 && (
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
  );
}
