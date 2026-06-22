import { useState, useRef, type KeyboardEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCaptureStore } from "@/stores/captureStore";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { X, Link2, Tag, Mic, Type, FileText, Image } from "lucide-react";
import { VoiceCapture } from "@/components/VoiceCapture";
import { ArticleCapture } from "@/components/ArticleCapture";
import { PdfCapture } from "@/components/PdfCapture";
import { ImageCapture } from "@/components/ImageCapture";

export function CaptureModal() {
  const { isOpen, close } = useCaptureStore();
  const [activeTab, setActiveTab] = useState("text"); // Keeps track of the current tab

  // Existing Text Form State
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // --- Existing Form Logic ---
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const resetForm = () => {
    setContent("");
    setSourceUrl("");
    setTags([]);
    setTagInput("");
    setActiveTab("text"); // Reset to text tab on close
  };

  const handleClose = () => {
    resetForm();
    close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await apiFetch("/api/v1/atoms", {
        method: "POST",
        body: JSON.stringify({
          content: content.trim(),
          sourceUrl: sourceUrl.trim() || undefined,
          sourceType: sourceUrl ? "article" : "note",
          tags,
        }),
      });

      toast.success("Atom captured!");
      handleClose(); // Close and reset
    } catch {
      toast.error("Failed to capture atom. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const charCount = content.length;
  const MAX_CHARS = 2000;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-semibold">Capture an idea</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="text" className="gap-2 text-xs sm:text-sm">
              <Type className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Text
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2 text-xs sm:text-sm">
              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Voice
            </TabsTrigger>
            <TabsTrigger value="article" className="gap-2 text-xs sm:text-sm">
              <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Link
            </TabsTrigger>
            <TabsTrigger value="pdf" className="gap-2 text-xs sm:text-sm">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Document
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2 text-xs sm:text-sm">
              <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Image
            </TabsTrigger>
          </TabsList>

          {/* --- TAB 1: YOUR EXISTING TEXT FORM --- */}
          <TabsContent value="text" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Write a note, paste a highlight, or jot down an idea…"
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
                  rows={5}
                  required
                  className="resize-none bg-muted/40 border-border/60 focus:border-border placeholder:text-muted-foreground/50 text-sm leading-relaxed"
                />
                <span className={`absolute bottom-2 right-3 text-[10px] tabular-nums ${charCount > MAX_CHARS * 0.9 ? 'text-orange-400' : 'text-muted-foreground/40'}`}>
                  {charCount}/{MAX_CHARS}
                </span>
              </div>

              <div className="relative flex items-center">
                <Link2 className="absolute left-3 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
                <Input
                  type="url"
                  placeholder="Source URL (optional)"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="pl-8 bg-muted/40 border-border/60 text-sm h-9 placeholder:text-muted-foreground/50"
                />
              </div>

              <div
                className="flex flex-wrap gap-1.5 items-center min-h-9 px-3 py-1.5 rounded-md border border-border/60 bg-muted/40 cursor-text"
                onClick={() => tagInputRef.current?.focus()}
              >
                <Tag className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[11px] font-normal gap-1 pl-2 pr-1 py-0 h-5"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  ref={tagInputRef}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKey}
                  onBlur={addTag}
                  placeholder={tags.length === 0 ? "Add tags…" : ""}
                  className="flex-1 min-w-16 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading || !content.trim()}>
                  {loading ? "Saving…" : "Capture"}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* --- TAB 2: VOICE CAPTURE --- */}
          <TabsContent value="voice" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            {/* Passing handleClose so the modal disappears when the upload finishes */}
            <VoiceCapture onCaptureComplete={() => {
              toast.success("Voice note captured!");
              handleClose();
            }} />
          </TabsContent>

          {/* --- TAB 3: ARTICLE CAPTURE --- */}
          <TabsContent value="article" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            {/* Passing handleClose here too */}
            <ArticleCapture onCaptureComplete={() => {
              toast.success("Article captured!");
              handleClose();
            }} />
          </TabsContent>

          {/* --- TAB 4: PDF CAPTURE --- */}
          <TabsContent value="pdf" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <PdfCapture onCaptureComplete={() => {
              toast.success("Document captured and text extracted!");
              handleClose();
            }} />
          </TabsContent>

          {/* --- TAB 5: IMAGE CAPTURE --- */}
          <TabsContent value="image" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <ImageCapture onCaptureComplete={() => {
              toast.success("Image captured and text extracted!");
              handleClose();
            }} />
          </TabsContent>
        </Tabs>

      </DialogContent>
    </Dialog>
  );
}