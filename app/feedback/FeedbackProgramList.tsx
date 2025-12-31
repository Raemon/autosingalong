'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Program } from '../programs/types';

export const FeedbackProgramList = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrograms = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/programs');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load programs');
      }
      const data = await response.json();
      setPrograms((data.programs || []).filter((p: Program) => !p.isSubprogram && !p.archived));
      setError(null);
    } catch (err) {
      console.error('Failed to load programs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load programs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  if (isLoading) {
    return <div className="p-8 text-gray-400">Loading programs...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  if (!programs.length) {
    return <div className="p-8 text-gray-400">No programs yet.</div>;
  }

  return (
    <div className="p-8">
      <ul className="space-y-4 mx-auto max-w-4xl">
        {programs.map((program) => (
          <li key={program.id}>
            <Link href={`/feedback/${program.id}`} className="text-2xl text-white font-georgia hover:underline">
              {program.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
