import { useState, useEffect } from 'react';

interface Atom {
  id: string;
  content: string;
  sourceUrl?: string;
  sourceType: string;
  tags: string[];
  createdAt: string;
}

export function useRecentAtoms() {
  const [atoms, setAtoms] = useState<Atom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/atoms?limit=5')
      .then((res) => res.json())
      .then((data) => {
        setAtoms(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { atoms, loading };
}