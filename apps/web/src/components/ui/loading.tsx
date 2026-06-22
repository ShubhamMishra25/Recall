import { Brain, Loader2 } from "lucide-react";

export function Loading() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
            <div className="flex items-center gap-3">
                <Brain className="h-10 w-10" />
                <h1 className="text-3xl font-bold tracking-tight">
                    Recall
                </h1>
            </div>

            <div className="mt-8 flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Restoring your memory...</span>
            </div>
        </div>
    );
}