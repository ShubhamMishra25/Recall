import { useState, useEffect } from 'react';
import { API_BASE } from "@/lib/api";

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
    fetch(`${API_BASE}/api/v1/atoms?limit=5`)
      .then((res) => res.json())
      .then((data) => {
        setAtoms(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { atoms, loading };
}