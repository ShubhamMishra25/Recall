import { useRecentAtoms } from '@/hooks/useAtoms';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function Library() {
  const { atoms, loading } = useRecentAtoms(); // will reuse; later we add pagination

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold tracking-tight">Library</h2>
      {loading ? (
        <Loading />
      ) : atoms.length === 0 ? (
        <p className="text-muted-foreground">Your library is empty. Capture something first.</p>
      ) : (
        atoms.map((atom) => (
          <Card key={atom.id}>
            <CardContent className="pt-4">
              <p className="line-clamp-2">{atom.content}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {atom.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-2">
                {atom.sourceUrl && (
                  <a href={atom.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground underline">
                    Source
                  </a>
                )}
                <Link
                  to={`/atom/${atom.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Read in full
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}