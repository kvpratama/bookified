"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Play, BookOpen } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { getBlobUrl, formatDocumentName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ContinueReadingProps {
  document: Tables<"documents">;
}

export function ContinueReading({ document }: ContinueReadingProps) {
  const router = useRouter();

  const handleResume = () => {
    router.push(`/chat/${document.id}`);
  };

  const displayName = formatDocumentName(document.name);
  const progress =
    document.page_count &&
    document.current_page &&
    document.page_count > 0 &&
    document.current_page > 0
      ? Math.min(
          Math.round((document.current_page / document.page_count) * 100),
          100,
        )
      : null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg transition-all hover:shadow-xl group">
      {/* Blurred Background Art */}
      {document.thumbnail_url && (
        <Image
          src={getBlobUrl(document.thumbnail_url)}
          alt=""
          fill
          unoptimized
          aria-hidden
          className="object-cover opacity-40 dark:opacity-30 blur-xl scale-110 pointer-events-none z-0"
        />
      )}

      <div className="relative z-10 flex flex-col md:flex-row items-center p-6 gap-6 md:gap-8">
        {/* Book Cover */}
        <div className="relative shrink-0 w-32 md:w-36 aspect-3/4 shadow-2xl rounded-sm overflow-hidden transform group-hover:scale-[1.02] transition-transform duration-500">
          {document.thumbnail_url ? (
            <Image
              src={getBlobUrl(document.thumbnail_url)}
              alt={document.name}
              fill
              unoptimized
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center p-4 text-center">
              <span className="font-serif text-primary/40 text-xs leading-snug line-clamp-3">
                {displayName}
              </span>
            </div>
          )}
        </div>

        {/* Metadata & Actions */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-primary/70">
            <BookOpen className="w-3 h-3" />
            {progress !== null ? "Continue Reading" : "Start Reading"}
          </div>

          <h2 className="text-2xl md:text-3xl font-serif text-foreground tracking-tight mb-2 line-clamp-2">
            {displayName}
          </h2>

          <p className="text-muted-foreground text-sm md:text-base mb-6 font-medium">
            by {document.author || "Unknown Author"}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button
              onClick={handleResume}
              size="lg"
              className="w-full sm:w-auto px-8 gap-2 bg-primary text-primary-foreground hover:opacity-90 transition-opacity rounded-full font-semibold shadow-md"
            >
              <Play className="w-4 h-4 fill-current" />
              {progress !== null ? "Resume" : "Start"}
            </Button>

            {progress !== null && (
              <div className="flex flex-col gap-1 w-full sm:w-32">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-muted" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
