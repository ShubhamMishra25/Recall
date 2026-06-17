import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCaptureStore } from "@/stores/captureStore";
import { toast } from "sonner";

export function CaptureModal() {
  const { isOpen, close } = useCaptureStore();
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/v1/atoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          sourceUrl: sourceUrl.trim() || undefined,
          sourceType: sourceUrl ? "article" : "note",
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) throw new Error("Failed to create atom");

      // Reset form
      setContent("");
      setSourceUrl("");
      setTags("");
      close();
      toast.success("Atom captured! It will be ready for review soon.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to capture atom. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Capture a new idea</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              placeholder="Write a note or paste a highlight..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
            />
          </div>
          <div>
            <Input
              type="url"
              placeholder="Source URL (optional)"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </div>
          <div>
            <Input
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Capture"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
