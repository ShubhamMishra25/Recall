import { useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createArticleAtom } from '@/lib/api';

export function ArticleCapture({ onCaptureComplete }: { onCaptureComplete?: () => void }) {
    const [url, setUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation to ensure it's a full URL
        if (!url.trim() || (!url.startsWith('http://') && !url.startsWith('https://'))) {
            setError("Please enter a valid URL starting with http:// or https://");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await createArticleAtom(url.trim());

            // Success! Clear the input and notify the modal to close
            setUrl('');
            if (onCaptureComplete) onCaptureComplete();

        } catch (err) {
            console.error("Failed to capture article:", err);
            setError("Failed to extract article. The site might be blocking our reader.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Input mirroring your Text tab design */}
            <div className="relative flex items-center">
                <Link2 className="absolute left-3 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                <Input 
                    type="url" 
                    placeholder="Paste article URL here (https://...)" 
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value);
                        setError(null); // Clear error as they type
                    }}
                    disabled={isSubmitting}
                    className="pl-9 bg-muted/40 border-border/60 text-sm h-10 placeholder:text-muted-foreground/50 w-full"
                    required
                />
            </div>
            
            {error && (
                <p className="text-[12px] text-destructive font-medium px-1">{error}</p>
            )}

            {/* Action Buttons aligned to the right */}
            <div className="flex justify-end gap-2 pt-2">
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                        setUrl('');
                        setError(null);
                    }}
                    disabled={isSubmitting || !url}
                >
                    Clear
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting || !url}>
                    {isSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    ) : null}
                    {isSubmitting ? "Extracting…" : "Save Article"}
                </Button>
            </div>
        </form>
    );
}