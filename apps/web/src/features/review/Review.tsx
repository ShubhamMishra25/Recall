import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getTodayReviewQueue, gradeAtom } from "@/lib/api";
import { CheckCircle2, ExternalLink } from "lucide-react";

interface ReviewItem {
  id: string;
  atom: {
    id: string;
    contentText: string;
    flashcardFront: string | null;
    flashcardBack: string | null;
    sourceUrl: string | null;
    tags: { tag: { name: string } }[];
  };
}

const GRADE_CONFIG = [
  { grade: 1, label: "Again", shortcut: "1", className: "border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/70" },
  { grade: 2, label: "Hard",  shortcut: "2", className: "border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/60" },
  { grade: 3, label: "Good",  shortcut: "3", className: "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/60" },
  { grade: 4, label: "Easy",  shortcut: "4", className: "border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/60" },
];

export function Review() {
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await getTodayReviewQueue();
        setQueue(res.data);
      } catch {
        toast.error("Failed to load today's reviews.");
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isFlipped) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setIsFlipped(true);
        }
        return;
      }
      const grade = parseInt(e.key);
      if (grade >= 1 && grade <= 4) handleGrade(grade);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFlipped, submitting]);

  const currentItem = queue[currentIndex];

  const handleGrade = async (grade: number) => {
    if (!currentItem || submitting) return;
    setSubmitting(true);
    try {
      await gradeAtom(currentItem.atom.id, grade);
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } catch {
      toast.error("Failed to save review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-4 space-y-6 animate-fade-up">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Daily Review</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Waking up your second brain…</p>
        </div>
        <div className="h-64 rounded-2xl bg-card border border-border animate-shimmer" />
      </div>
    );
  }

  // ── Done / empty ─────────────────────────────────────────────
  if (!currentItem) {
    return (
      <div className="max-w-2xl mx-auto py-4 space-y-6 animate-fade-up">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Daily Review</h2>
          <p className="text-sm text-muted-foreground mt-0.5">All caught up for today.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl text-center gap-3">
          <CheckCircle2 className="w-10 h-10 text-muted-foreground/40" />
          <div>
            <p className="text-base font-medium">Nothing left to review</p>
            <p className="text-sm text-muted-foreground mt-1">Come back tomorrow or capture some new ideas.</p>
          </div>
        </div>
      </div>
    );
  }

  const { atom } = currentItem;
  const frontContent = atom.flashcardFront || atom.contentText;
  const backContent  = atom.flashcardBack  || "No back side defined for this atom yet.";
  const progress     = Math.round((currentIndex / queue.length) * 100);

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6 animate-fade-up">
      {/* Header + progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Daily Review</h2>
          <span className="text-sm tabular-nums text-muted-foreground">
            {currentIndex + 1} <span className="text-muted-foreground/50">/</span> {queue.length}
          </span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        key={currentIndex}
        className="animate-card-flip-in min-h-[280px] rounded-2xl border border-border bg-card flex flex-col overflow-hidden"
      >
        {/* Front */}
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
          <p className="text-lg leading-relaxed text-foreground">{frontContent}</p>
        </div>

        {/* Tags */}
        {atom.tags.length > 0 && (
          <div className="flex justify-center gap-2 px-6 py-3 border-t border-border/50">
            {atom.tags.map((t) => (
              <Badge key={t.tag.name} variant="secondary" className="text-[10px] font-normal">
                {t.tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Back (revealed) */}
        {isFlipped && (
          <div className="border-t border-border/50 px-8 py-6 bg-muted/30 animate-fade-up space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed text-center whitespace-pre-wrap">
              {backContent}
            </p>
            {atom.sourceUrl && (
              <div className="flex justify-center">
                <a
                  href={atom.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View source
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div>
        {!isFlipped ? (
          <Button
            className="w-full h-12 text-base font-medium"
            onClick={() => setIsFlipped(true)}
          >
            Show Answer
            <kbd className="ml-2 text-[10px] font-mono opacity-50 hidden sm:inline">Space</kbd>
          </Button>
        ) : (
          <div className="grid grid-cols-4 gap-2 animate-fade-up">
            {GRADE_CONFIG.map(({ grade, label, shortcut, className }) => (
              <Button
                key={grade}
                variant="outline"
                className={`h-12 font-medium flex flex-col gap-0.5 transition-all duration-150 ${className}`}
                disabled={submitting}
                onClick={() => handleGrade(grade)}
              >
                <span className="text-sm">{label}</span>
                <kbd className="text-[9px] opacity-40 font-mono hidden sm:block">{shortcut}</kbd>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}