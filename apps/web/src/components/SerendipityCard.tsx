import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      } catch (error) {
        console.error("Failed to fetch serendipity card", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCard();
  }, []);

  if (isLoading) {
    return (
      <Card className="border-muted animate-pulse bg-muted/20">
        <CardContent className="h-32 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Finding a connection...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!atom) {
    return null; // Don't render anything if there's no data yet (e.g., brand new user)
  }

  return (
    <Card className="relative overflow-hidden border-primary/20 shadow-md bg-gradient-to-br from-background to-primary/[0.03]">
      {/* Subtle decorative top border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-primary/10" />

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-sm font-medium text-primary">
          <Sparkles className="w-4 h-4 mr-2" />
          Daily Rediscovery
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <p className="text-foreground text-sm leading-relaxed border-l-2 border-primary/30 pl-4 italic">
            "{atom.content}"
          </p>

          {atom.flashcardFront && (
            <div className="bg-muted/50 p-3 rounded-md mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                AI Flashcard
              </p>
              <p className="text-sm font-medium">{atom.flashcardFront}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-wrap gap-2">
              {atom.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>

            <button className="text-xs flex items-center text-muted-foreground hover:text-primary transition-colors">
              Review Note <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
