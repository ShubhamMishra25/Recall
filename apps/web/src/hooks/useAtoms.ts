import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

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
    const loadAtoms = async () => {
      try {
        const data = await apiFetch("/api/v1/atoms?limit=5");
        setAtoms(data.data || []);
      } catch (err) {
        console.error("Failed to load atoms:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAtoms();
  }, []);

  return { atoms, loading };
}