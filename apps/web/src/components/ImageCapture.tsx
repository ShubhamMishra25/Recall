import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, X, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getImageUploadUrl, createImageAtom } from '@/lib/api';

export function ImageCapture({ onCaptureComplete }: { onCaptureComplete?: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Clean up memory from object URLs
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false); setError(null);
        if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
    };
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
    };

    const validateAndSetFile = (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) {
            setError("Please upload a valid image file (JPEG, PNG).");
            return;
        }
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
    };

    const clearFile = () => {
        setFile(null);
        setPreviewUrl(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);

        try {
            const creds = await getImageUploadUrl(file.name);
            
            const uploadResponse = await fetch(creds.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'x-ms-blob-type': 'BlockBlob',
                    'Content-Type': file.type,
                },
            });

            if (!uploadResponse.ok) throw new Error("Failed to upload image to Azure");

            await createImageAtom(creds.fileUrl, file.name);

            clearFile();
            if (onCaptureComplete) onCaptureComplete();
        } catch {
            setError("Failed to extract data from image.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-4 mt-2">
            {!file ? (
                <div 
                    onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/20 hover:bg-muted/40'}`}
                >
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                    <div className="p-3 bg-background rounded-full shadow-sm mb-3 border border-border/50">
                        <ImageIcon className={`w-6 h-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <p className="text-sm font-medium mb-1">Click or drag a photo</p>
                    <p className="text-[11px] text-muted-foreground text-center">Whiteboards, handwritten notes, or diagrams</p>
                </div>
            ) : (
                <div className="relative overflow-hidden rounded-xl border border-border/60 bg-black/5">
                    {previewUrl && (
                        <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover opacity-80" />
                    )}
                    <div className="absolute top-2 right-2">
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-md hover:bg-destructive hover:text-white" onClick={clearFile} disabled={isProcessing}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    {isProcessing && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <p className="text-sm font-medium animate-pulse">AI is reading your image...</p>
                        </div>
                    )}
                </div>
            )}

            {error && <p className="text-[12px] text-destructive font-medium px-1 text-center">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={clearFile} disabled={isProcessing || !file}>Cancel</Button>
                <Button onClick={handleUpload} size="sm" disabled={isProcessing || !file}>
                    {isProcessing ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-2" />}
                    {isProcessing ? "Processing…" : "Analyze Image"}
                </Button>
            </div>
        </div>
    );
}