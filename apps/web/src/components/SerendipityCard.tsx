import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getDailySerendipity } from "@/lib/api";

interface Atom {
  id: string;
  content: string;
  flashcardFront: string | null;
  flashcardBack: string | null;
}

export function SerendipityCard() {
  const [atom, setAtom] = useState<Atom | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCard() {
      try {
        const response = await getDailySerendipity();
        setAtom({
          id: response.data.id,
          content: response.data.content_text,
          flashcardFront: response.data.flashcard_front,
          flashcardBack: response.data.flashcard_back,
        });
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

        {/* Teaser — clamped, full text lives on the /serendipity page */}
        <p className="text-sm leading-relaxed text-foreground border-l-2 border-border pl-4 line-clamp-3">
          {atom.content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <Link
            to="/serendipity"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
          >
            Read in full
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
