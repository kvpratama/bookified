"use client";

import { useRouter } from "next/navigation";
import { Play, BookOpen } from "lucide-react";
import { useAppStore, type PdfDocument } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ContinueReadingProps {
  document: PdfDocument;
}

export function ContinueReading({ document }: ContinueReadingProps) {
  const router = useRouter();
  const setLastOpened = useAppStore((state) => state.setLastOpened);

  const handleResume = () => {
    setLastOpened(document.id);
    router.push(`/chat/${document.id}`);
  };

  const displayName = document.name.replace(".pdf", "").replace(/_/g, " ");

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg transition-all hover:shadow-xl group">
      {/* Blurred Background Art */}
      {document.thumbnailUrl && (
        <div
          className="absolute inset-0 z-0 opacity-20 dark:opacity-30 blur-xl scale-110 pointer-events-none"
          style={{
            backgroundImage: `url(${document.thumbnailUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      <div className="relative z-10 flex flex-col md:flex-row items-center p-6 gap-6 md:gap-8">
        {/* Book Cover */}
        <div className="relative shrink-0 w-32 md:w-36 aspect-3/4 shadow-2xl rounded-sm overflow-hidden transform group-hover:scale-[1.02] transition-transform duration-500">
          {document.thumbnailUrl ? (
            <img
              src={document.thumbnailUrl}
              alt={document.name}
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
            Continue Reading
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
              Resume
            </Button>

            {/* Progress indicator */}
            <div className="flex flex-col gap-1 w-full sm:w-32">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>Progress</span>
                <span>35%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[35%] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
