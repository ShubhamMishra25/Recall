import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { getDailySerendipity } from "@/lib/api";

interface Atom {
  id: string;
  content: string;
  flashcardFront: string | null;
  flashcardBack: string | null;
}

export function SerendipityPage() {
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

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6 animate-fade-up">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">Daily Rediscovery</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-6 rounded-lg bg-card border border-border animate-shimmer" />
          <div className="h-40 rounded-xl bg-card border border-border animate-shimmer" />
        </div>
      ) : !atom ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing to rediscover yet. Capture a few atoms and check back tomorrow.
          </p>
        </div>
      ) : (
        <article className="rounded-2xl border border-border bg-card p-6 space-y-6">
          {/* Full content — reading layout */}
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground">
            {atom.content}
          </p>

          {atom.flashcardFront && (
            <div className="rounded-lg border border-border/60 bg-muted/40 px-4 py-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                AI Flashcard
              </p>
              <p className="text-sm text-foreground/80">{atom.flashcardFront}</p>
              {atom.flashcardBack && (
                <p className="text-sm text-muted-foreground">{atom.flashcardBack}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end pt-2 border-t border-border/40">
            <Link
              to="/review"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Review it
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </article>
      )}
    </div>
  );
}
