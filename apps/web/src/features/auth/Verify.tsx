import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Verify() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verify } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(true);
      return;
    }
    verify(token)
      .then(() => navigate('/'))
      .catch(() => setError(true));
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm animate-fade-up text-center space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto">
          <Brain className="w-6 h-6 text-primary-foreground" />
        </div>

        {error ? (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 mx-auto">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-sm">This link is invalid or expired</p>
              <p className="text-xs text-muted-foreground mt-1">Magic links expire after 15 minutes.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/auth/login')}
            >
              Request a new link
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Signing you in…</p>
          </div>
        )}
      </div>
    </div>
  );
}