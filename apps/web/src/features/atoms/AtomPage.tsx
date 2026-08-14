import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getAtom } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface Atom {
  id: string;
  content: string;
  sourceUrl: string | null;
  sourceType: string;
  flashcardFront: string | null;
  flashcardBack: string | null;
  tags: string[];
  createdAt: string;
}

export function AtomPage() {
  const { id } = useParams();
  const [atom, setAtom] = useState<Atom | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAtom() {
      if (!id) return;
      try {
        const data = await getAtom(id);
        setAtom(data);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAtom();
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6 animate-fade-up">
      <Link
        to="/library"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to library
      </Link>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-6 rounded-lg bg-card border border-border animate-shimmer" />
          <div className="h-40 rounded-xl bg-card border border-border animate-shimmer" />
        </div>
      ) : notFound || !atom ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            This atom doesn't exist or is no longer available.
          </p>
        </div>
      ) : (
        <article className="rounded-2xl border border-border bg-card p-6 space-y-6">
          {/* Meta */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Badge variant="secondary" className="text-[10px] font-normal capitalize">
              {atom.sourceType}
            </Badge>
            {atom.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {atom.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

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

          {atom.sourceUrl && (
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <a
                href={atom.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View source
              </a>
            </div>
          )}
        </article>
      )}
    </div>
  );
}
