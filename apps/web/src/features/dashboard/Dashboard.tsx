import { useRecentAtoms } from '@/hooks/useAtoms';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function Dashboard() {
  const { atoms, loading } = useRecentAtoms();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Good morning</h2>
        <p className="text-muted-foreground">Here's what you've captured recently.</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : atoms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No atoms yet. Tap Capture to add your first idea.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {atoms.map((atom) => (
            <Card key={atom.id}>
              <CardContent className="pt-4">
                <p className="line-clamp-2">{atom.content}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {atom.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                {atom.sourceUrl && (
                  <a
                    href={atom.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground underline mt-1 block"
                  >
                    Source
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