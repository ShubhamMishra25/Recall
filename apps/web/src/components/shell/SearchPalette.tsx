import { useState, useEffect, useTransition } from "react";
import { Search, FileText, Link, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchAtoms } from "@/lib/api";

interface SearchResult {
  id: string;
  content: string;
  sourceUrl: string | null;
  sourceType: "article" | "note" | "pdf" | "voice" | "image";
  flashcardFront: string | null;
  flashcardBack: string | null;
  createdAt: string;
  similarity: number;
}

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  // 1. Listen for global Cmd+K or Ctrl+K shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 2. Query the semantic search API when user types
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      startTransition(async () => {
        // We moved the empty check INSIDE the asynchronous transition
        if (!query.trim()) {
          setResults([]);
          return;
        }

        try {
          const response = await searchAtoms(query);
          setResults(response.data || []);
        } catch (error) {
          console.error("Semantic search failed:", error);
        }
      });
    }, 250); // 250ms debounce to protect your Azure OpenAI rate limits

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <>
      {/* Visual trigger button placed in your Topbar / Sidebar */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-between w-full max-w-sm px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 border rounded-md hover:bg-muted/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          <span>Search your mind semantically...</span>
        </div>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-sm">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* The Command Palette Overlay */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden shadow-2xl border-muted/60">
          <div className="flex items-center px-4 border-b">
            <Search className="w-5 h-5 text-muted-foreground mr-2 shrink-0" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a concept, question, or loose memory..."
              className="h-12 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-0 text-base"
              autoFocus
            />
            {isPending && (
              <Sparkles className="w-4 h-4 text-primary animate-pulse shrink-0 ml-2" />
            )}
          </div>

          <div className="max-h-87.5 overflow-y-auto p-2 space-y-1">
            {results.length === 0 && !isPending && (
              <p className="text-xs text-center text-muted-foreground py-6">
                {query
                  ? "No conceptual matches found."
                  : 'Search by meaning (e.g., "quantum theories" or "lightspeed logic")'}
              </p>
            )}

            {results.map((item) => (
              <div
                key={item.id}
                className="group flex items-start gap-3 p-3 rounded-md hover:bg-muted/60 cursor-pointer transition-all border border-transparent hover:border-muted"
                onClick={() => {
                  // Handle navigating or selecting the atom (e.g., opening a drawer or card modal)
                  setOpen(false);
                }}
              >
                <div className="mt-0.5 p-1.5 rounded bg-muted text-muted-foreground group-hover:bg-background group-hover:text-primary transition-colors">
                  {item.sourceUrl ? (
                    <Link className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium truncate text-foreground">
                      {item.flashcardFront || "Raw Captured Note"}
                    </h4>
                    <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                      {Math.round(item.similarity * 100)}% match
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {item.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
