import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getTodayReviewQueue, gradeAtom } from "@/lib/api";

// Matching the nested structure from your Prisma query
interface ReviewItem {
  id: string; // ReviewState ID
  atom: {
    id: string;
    contentText: string;
    flashcardFront: string | null;
    flashcardBack: string | null;
    sourceUrl: string | null;
    tags: { tag: { name: string } }[];
  };
}

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
      } catch (error) {
        console.error(error);
        toast.error("Failed to load today's reviews.");
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, []);

  const currentItem = queue[currentIndex];

  const handleGrade = async (grade: number) => {
    if (!currentItem || submitting) return;

    setSubmitting(true);
    try {
      // Fire the API call in the background
      await gradeAtom(currentItem.atom.id, grade);
      
      // Optimistically move to the next card
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Daily Review</h2>
          <p className="text-muted-foreground">Waking up your second brain...</p>
        </div>
      </div>
    );
  }

  // If we finished the queue or it was empty to begin with
  if (!currentItem) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Daily Review</h2>
          <p className="text-muted-foreground">You're all caught up for today!</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <h3 className="text-lg font-medium">No more atoms to review</h3>
            <p className="text-muted-foreground mt-2">
              Great job! Come back tomorrow or capture some new ideas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { atom } = currentItem;
  // Fallback to contentText if no explicit flashcard front is set
  const frontContent = atom.flashcardFront || atom.contentText;
  const backContent = atom.flashcardBack || "No back side defined for this atom yet.";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Daily Review</h2>
        <p className="text-muted-foreground">
          Card {currentIndex + 1} of {queue.length}
        </p>
      </div>

      <Card className="min-h-[300px] flex flex-col transition-all duration-300">
        <CardContent className="pt-6 flex-grow flex flex-col">
          {/* Front of Card */}
          <div className="flex-grow flex flex-col justify-center text-center px-4 py-8">
            <p className="text-xl leading-relaxed whitespace-pre-wrap">{frontContent}</p>
          </div>

          {/* Tags (Optional context) */}
          {atom.tags.length > 0 && (
            <div className="flex justify-center gap-2 mt-4 pb-4 border-b">
              {atom.tags.map((t) => (
                <Badge key={t.tag.name} variant="secondary" className="opacity-70">
                  {t.tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Back of Card (Only visible if flipped) */}
          {isFlipped && (
            <div className="mt-6 mb-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-muted-foreground whitespace-pre-wrap">{backContent}</p>
              
              {atom.sourceUrl && (
                <a
                  href={atom.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline mt-4 block"
                >
                  View Source
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="pt-4">
        {!isFlipped ? (
          <Button 
            className="w-full h-14 text-lg" 
            onClick={() => setIsFlipped(true)}
          >
            Reveal Answer
          </Button>
        ) : (
          <div className="grid grid-cols-4 gap-3 animate-in fade-in duration-300">
            <Button 
              variant="destructive" 
              className="h-14 font-medium" 
              disabled={submitting}
              onClick={() => handleGrade(1)}
            >
              Again
            </Button>
            <Button 
              variant="outline" 
              className="h-14 font-medium border-orange-200 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-900/50 dark:hover:bg-orange-900/20" 
              disabled={submitting}
              onClick={() => handleGrade(2)}
            >
              Hard
            </Button>
            <Button 
              variant="outline" 
              className="h-14 font-medium border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-900/50 dark:hover:bg-green-900/20" 
              disabled={submitting}
              onClick={() => handleGrade(3)}
            >
              Good
            </Button>
            <Button 
              variant="default" 
              className="h-14 font-medium bg-blue-600 hover:bg-blue-700 text-white" 
              disabled={submitting}
              onClick={() => handleGrade(4)}
            >
              Easy
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}