import { useRecentAtoms } from '@/hooks/useAtoms';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SerendipityCard } from '@/components/SerendipityCard';
import { ExternalLink } from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Late night session';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export function Dashboard() {
  const { atoms, loading } = useRecentAtoms();

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Greeting */}
      <div className="animate-fade-up">
        <h2 className="text-2xl font-semibold tracking-tight">{getGreeting()}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Here's what you've been building.</p>
      </div>

      {/* Serendipity */}
      <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
        <SerendipityCard />
      </div>

      {/* Recent Atoms */}
      <div className="animate-fade-up" style={{ animationDelay: '180ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Recent Atoms</h3>
          {atoms.length > 0 && (
            <span className="text-xs text-muted-foreground">{atoms.length} captured</span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-xl bg-card border border-border animate-shimmer"
              />
            ))}
          </div>
        ) : atoms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-xl text-center">
            <p className="text-muted-foreground text-sm">No atoms yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tap Capture or record a voice note to add your first idea.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {atoms.map((atom, idx) => (
              <Card
                key={atom.id}
                className="flex flex-col justify-between bg-card border-border/60 hover:border-border hover:bg-card/80 transition-all duration-200 group"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <CardContent className="pt-4 pb-4 flex-1 flex flex-col gap-3">
                  <p className="line-clamp-4 text-sm leading-relaxed text-foreground/90">
                    {atom.content}
                  </p>

                  {atom.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-auto pt-3 border-t border-border/40">
                      {atom.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] font-normal px-2 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {atom.sourceUrl && (
                    <a
                      href={atom.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Source
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}