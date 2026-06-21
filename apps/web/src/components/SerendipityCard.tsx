import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDailySerendipity } from "@/lib/api";

interface Atom {
  id: string;
  content: string;
  flashcardFront: string | null;
  flashcardBack: string | null;
  tags?: string[];
}

export function SerendipityCard() {
  const [atom, setAtom] = useState<Atom | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCard() {
      try {
        const response = await getDailySerendipity();
        setAtom(response.data);
      } catch {
        // Silently fail — serendipity is a bonus feature
      } finally {
        setIsLoading(false);
      }
    }
    fetchCard();
  }, []);

  if (isLoading) {
    return (
      <div className="h-28 rounded-2xl border border-border bg-card animate-shimmer" />
    );
  }

  if (!atom) return null;

  return (
    <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Daily Rediscovery
          </span>
        </div>

        {/* Quote */}
        <p className="text-sm leading-relaxed text-foreground border-l-2 border-border pl-4">
          {atom.content}
        </p>

        {/* AI flashcard front */}
        {atom.flashcardFront && (
          <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              AI Flashcard
            </p>
            <p className="text-xs text-foreground/80">{atom.flashcardFront}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-wrap gap-1.5">
            {atom.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] font-normal px-2 py-0">
                {tag}
              </Badge>
            ))}
          </div>
          <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0">
            Review
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
