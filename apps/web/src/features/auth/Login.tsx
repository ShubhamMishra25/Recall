import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, ArrowRight, Loader2 } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-8 animate-fade-up">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Recall</h1>
            <p className="text-sm text-muted-foreground mt-1">Your personal knowledge base</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          {sent ? (
            <div className="text-center py-4 space-y-2">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <span className="text-lg">✉️</span>
              </div>
              <p className="font-medium text-sm">Check your inbox</p>
              <p className="text-xs text-muted-foreground">
                We sent a magic link to <span className="text-foreground font-medium">{email}</span>
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 mt-2 block mx-auto transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-base font-semibold">Sign in</h2>
                <p className="text-xs text-muted-foreground mt-1">We'll send a magic link — no password needed.</p>
              </div>

              {error && (
                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="bg-muted/40 border-border/60 h-10 text-sm placeholder:text-muted-foreground/50"
                />
                <Button
                  type="submit"
                  className="w-full h-10"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</>
                  ) : (
                    <>Continue<ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground/50">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}