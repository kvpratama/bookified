"use client";

import type { Citation } from "@/lib/store";

interface CitationListProps {
  citations: Citation[];
  onCitationClick: (page: number) => void;
}

export function CitationList({
  citations,
  onCitationClick,
}: CitationListProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border/30">
      <p className="text-[11px] font-serif italic text-muted-foreground/70 mb-2">
        Sources:
      </p>
      <ol className="space-y-2">
        {citations.map((citation, i) => (
          <li key={i} className="text-[13px] leading-relaxed">
            {citation.text && (
              <span className="text-foreground/80 font-serif">
                &quot;{citation.text}&quot;
              </span>
            )}
            {citation.page && (
              <>
                {citation.text && " "}
                <button
                  type="button"
                  onClick={() => onCitationClick(citation.page!)}
                  className="text-primary/80 hover:text-primary hover:underline decoration-primary/40 underline-offset-2 transition-colors font-medium"
                >
                  (Page {citation.page})
                </button>
              </>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
