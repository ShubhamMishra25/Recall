import { useState, useRef } from 'react';
import { Mic, Square, Trash2, UploadCloud, Loader2, Play, Pause, Sparkles } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Button } from '@/components/ui/button';
import { getVoiceUploadUrl, createVoiceAtom } from '@/lib/api';

const WAVEFORM_HEIGHTS = [16, 28, 20, 36, 12, 24, 40, 32, 16, 28, 44, 20, 12, 32, 24, 36, 16, 28, 40, 20, 12, 24, 32, 16];
const RECORD_HEIGHTS   = [16, 32, 12, 24, 40, 28, 16, 36, 20, 30, 8, 24, 38, 16, 32, 12];

export function VoiceCapture({ onCaptureComplete }: { onCaptureComplete?: () => void }) {
    const {
        isRecording,
        audioBlob,
        audioUrl,
        formattedTime,
        startRecording,
        stopRecording,
        clearAudio,
        error: recorderError
    } = useAudioRecorder();

    const [isUploading, setIsUploading] = useState(false);
    const [isPlaying, setIsPlaying]     = useState(false);
    const [playbackProgress, setPlaybackProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handlePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current  = audioRef.current.currentTime;
        const duration = audioRef.current.duration || 1;
        setPlaybackProgress((current / duration) * 100);
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
        setPlaybackProgress(0);
    };

    const handleUpload = async () => {
        if (!audioBlob) return;
        setIsUploading(true);
        try {
            const creds = await getVoiceUploadUrl();
            const uploadResponse = await fetch(creds.uploadUrl, {
                method: 'PUT',
                body: audioBlob,
                headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': 'audio/webm' },
            });
            if (!uploadResponse.ok) throw new Error("Failed to upload audio to Azure");
            await createVoiceAtom(creds.fileUrl);
            clearAudio();

            // tell the parent (modal) to close
            if (onCaptureComplete) onCaptureComplete();
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="relative overflow-hidden flex flex-col items-center w-full border border-border/60 rounded-2xl bg-card p-5 transition-colors duration-200 hover:border-border">

            {/* Header */}
            <div className="flex items-center justify-between w-full pb-4 mb-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${
                            isRecording ? 'bg-destructive animate-pulse' :
                            audioBlob   ? 'bg-amber-400' :
                            'bg-muted-foreground/30'
                        }`}
                    />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Voice Capture
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/50">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Transcribe</span>
                </div>
            </div>

            {/* Error */}
            {recorderError && (
                <div className="w-full bg-destructive/10 text-destructive text-xs rounded-xl p-3 border border-destructive/20 text-center mb-4">
                    {recorderError}
                </div>
            )}

            {/* States */}
            {!audioBlob ? (
                !isRecording ? (
                    /* ── IDLE ── */
                    <div className="flex flex-col items-center justify-center py-6 w-full">
                        <div className="relative flex items-center justify-center mb-5">
                            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ripple-1" />
                            <div className="absolute inset-0 rounded-full bg-primary/5  animate-ripple-2" />
                            <button
                                onClick={() => { setIsPlaying(false); setPlaybackProgress(0); startRecording(); }}
                                disabled={isUploading}
                                className="relative z-10 w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 group cursor-pointer disabled:opacity-50"
                            >
                                <Mic className="w-8 h-8 text-primary-foreground group-hover:scale-110 transition-transform duration-200" />
                            </button>
                        </div>
                        <p className="text-sm font-medium text-foreground">Record a voice note</p>
                        <p className="text-xs text-muted-foreground mt-1">Transcribed by AI, stored as an atom</p>
                    </div>
                ) : (
                    /* ── RECORDING ── */
                    <div className="flex flex-col items-center justify-center py-6 w-full">
                        <div className="text-5xl font-mono tracking-tight text-foreground font-light mb-6 tabular-nums">
                            {formattedTime}
                        </div>

                        {/* Animated bars */}
                        <div className="flex items-end gap-1 h-12 justify-center w-full mb-8">
                            {RECORD_HEIGHTS.map((h, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-primary rounded-full origin-bottom"
                                    style={{
                                        height: `${h}px`,
                                        animation: 'wave-bounce 0.8s ease-in-out infinite',
                                        animationDelay: `${i * 0.05}s`,
                                    }}
                                />
                            ))}
                        </div>

                        <button
                            onClick={stopRecording}
                            className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                        >
                            <Square className="w-5 h-5 text-destructive-foreground fill-current" />
                        </button>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-destructive/70 mt-3 animate-pulse">
                            Recording
                        </p>
                    </div>
                )
            ) : (
                /* ── PREVIEW ── */
                <div className="flex flex-col items-center justify-center w-full py-2 gap-4">
                    <p className="text-sm font-medium text-foreground self-start">Preview</p>

                    {/* Player */}
                    <div className="flex items-center gap-3 w-full bg-muted/30 border border-border/50 rounded-xl p-3">
                        <button
                            onClick={handlePlayPause}
                            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                        >
                            {isPlaying
                                ? <Pause className="w-4 h-4 fill-current" />
                                : <Play  className="w-4 h-4 fill-current ml-0.5" />
                            }
                        </button>

                        {audioUrl && (
                            <audio
                                ref={audioRef}
                                src={audioUrl}
                                onTimeUpdate={handleTimeUpdate}
                                onEnded={handleAudioEnded}
                                className="hidden"
                            />
                        )}

                        {/* Waveform */}
                        <div className="flex-1 flex items-center justify-between gap-0.5 h-10">
                            {WAVEFORM_HEIGHTS.map((h, i) => {
                                const pct = (i / WAVEFORM_HEIGHTS.length) * 100;
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 rounded-full transition-colors duration-150"
                                        style={{
                                            height: `${h}px`,
                                            backgroundColor: playbackProgress >= pct
                                                ? 'var(--color-primary)'
                                                : 'oklch(1 0 0 / 12%)',
                                        }}
                                    />
                                );
                            })}
                        </div>

                        <span className="text-[11px] font-mono text-muted-foreground tabular-nums shrink-0">
                            {formattedTime}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 w-full">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setIsPlaying(false); setPlaybackProgress(0); clearAudio(); }}
                            disabled={isUploading}
                            className="flex-1 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all duration-200"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            Retake
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="flex-1"
                        >
                            {isUploading ? (
                                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Transcribing…</>
                            ) : (
                                <><UploadCloud className="w-3.5 h-3.5 mr-1.5" />Process Note</>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}