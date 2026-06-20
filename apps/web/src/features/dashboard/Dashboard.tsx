import { useRecentAtoms } from '@/hooks/useAtoms';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SerendipityCard } from '@/components/SerendipityCard'; // 1. Import the new card

export function Dashboard() {
  const { atoms, loading } = useRecentAtoms();

  return (
    <div className="space-y-6 container max-w-5xl mx-auto py-8 px-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Good morning</h2>
        <p className="text-muted-foreground">Here's what you've captured recently.</p>
      </div>

      {/* 2. Drop the Serendipity Card right here at the top! */}
      <div className="mb-8">
        <SerendipityCard />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : atoms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No atoms yet. Tap Capture to add your first idea.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> 
          {/* Note: I updated this to a grid layout to make your cards look much cleaner! */}
          {atoms.map((atom) => (
            <Card key={atom.id} className="flex flex-col justify-between">
              <CardContent className="pt-4 flex-1 flex flex-col">
                <p className="line-clamp-4 text-sm flex-1">{atom.content}</p>
                
                <div className="flex gap-2 mt-4 pt-4 border-t border-border/50 flex-wrap">
                  {atom.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                {atom.sourceUrl && (
                  <a
                    href={atom.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors underline mt-3 block"
                  >
                    View Source
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}