import { useState, useRef } from 'react';
import { UploadCloud, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPdfUploadUrl, createPdfAtom } from '@/lib/api';

export function PdfCapture({ onCaptureComplete }: { onCaptureComplete?: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Drag & Drop Handlers ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setError(null);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            validateAndSetFile(droppedFile);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile: File) => {
        if (selectedFile.type !== 'application/pdf') {
            setError("Only PDF files are supported right now.");
            return;
        }
        
        // Optional: Block files over 10MB to save Azure bandwidth
        if (selectedFile.size > 10 * 1024 * 1024) {
            setError("File is too large. Please upload a PDF under 10MB.");
            return;
        }

        setFile(selectedFile);
    };

    const clearFile = () => {
        setFile(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- Upload Pipeline ---
    const handleUpload = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);

        try {
            // Step 1: Get Azure SAS Token
            setStatusText("Requesting secure upload link...");
            const creds = await getPdfUploadUrl(file.name);
            
            // Step 2: Upload direct to Azure
            setStatusText("Uploading to cloud...");
            const uploadResponse = await fetch(creds.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'x-ms-blob-type': 'BlockBlob',
                    'Content-Type': 'application/pdf',
                },
            });

            if (!uploadResponse.ok) {
                throw new Error("Failed to upload PDF to Azure");
            }

            // Step 3: Trigger Backend Extraction
            setStatusText("Extracting text via AI...");
            await createPdfAtom(creds.fileUrl, file.name);

            // Success! 
            clearFile();
            if (onCaptureComplete) onCaptureComplete();

        } catch (err) {
            console.error("PDF upload failed:", err);
            setError("Failed to process document. Please try again.");
        } finally {
            setIsProcessing(false);
            setStatusText("");
        }
    };

    return (
        <div className="space-y-4 mt-2">
            {!file ? (
                // --- DROP ZONE STATE ---
                <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
                        ${isDragging 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border'}
                    `}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        accept="application/pdf" 
                        className="hidden" 
                    />
                    
                    <div className="p-3 bg-background rounded-full shadow-sm mb-3 border border-border/50">
                        <UploadCloud className={`w-6 h-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    
                    <p className="text-sm font-medium mb-1">
                        {isDragging ? "Drop syllabus here!" : "Click or drag PDF to upload"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        PDFs up to 10MB
                    </p>
                </div>
            ) : (
                // --- FILE SELECTED STATE ---
                <div className="flex flex-col gap-4 p-4 border border-border/60 rounded-xl bg-muted/10">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium truncate" title={file.name}>
                                    {file.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </div>
                        </div>
                        
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 shrink-0 hover:bg-destructive/10 hover:text-destructive" 
                            onClick={clearFile}
                            disabled={isProcessing}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {isProcessing && (
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {statusText}
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="text-[12px] text-destructive font-medium px-1 text-center">{error}</p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFile}
                    disabled={isProcessing || !file}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleUpload} 
                    size="sm" 
                    disabled={isProcessing || !file}
                >
                    {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    ) : null}
                    {isProcessing ? "Processing…" : "Extract Text"}
                </Button>
            </div>
        </div>
    );
}