import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioRecorder() {
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState<number>(0)
    const [error, setError] = useState<string | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([])
    const audioUrlRef = useRef<string | null>(null)
    const timerRef = useRef<number | null>(null)

    const revokeAudioUrl = useCallback(() => {
        if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
        }
    }, []);

    // Revoke the object URL on unmount so we don't leak memory.
    useEffect(() => () => {
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    }, []);

    const startRecording = useCallback(async () => {
        try {
            setError(null)
            setAudioBlob(null)
            setAudioUrl(null)
            revokeAudioUrl()
            audioChunksRef.current = []

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);

                // Create the preview URL here (in the event handler) and keep it
                // in a ref so we can revoke it later — no effect needed.
                revokeAudioUrl();
                const url = URL.createObjectURL(blob);
                audioUrlRef.current = url;
                setAudioUrl(url);

                stream.getTracks().forEach((track) => track.stop());
            }

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            setError('Failed to access microphone. Please allow microphone access and try again.')
        }
    }, [revokeAudioUrl]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    }, [isRecording]);

    const clearAudio = useCallback(() => {
        setAudioBlob(null);
        setAudioUrl(null);
        revokeAudioUrl();
        setRecordingTime(0);
    }, [revokeAudioUrl]);

    const formattedTime = new Date(recordingTime * 1000).toISOString().substring(14, 19);

    return {
        isRecording,
        audioBlob,
        audioUrl,
        formattedTime,
        error,
        startRecording,
        stopRecording,
        clearAudio,
    };
}