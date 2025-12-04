'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatRelativeTimestamp } from '@/lib/dateUtils';

type ChangelogVersion = {
  id: string;
  songId: string;
  songTitle: string;
  label: string;
  content: string | null;
  previousVersionId: string | null;
  previousContent: string | null;
  createdBy: string | null;
  createdAt: string;
};

const calculateDiff = (content: string | null, previousContent: string | null) => {
  const currentLength = content?.length ?? 0;
  const previousLength = previousContent?.length ?? 0;
  if (previousContent === null) {
    return { added: currentLength, removed: 0 };
  }
  const diff = currentLength - previousLength;
  return { added: Math.max(0, diff), removed: Math.max(0, -diff) };
};

const ChangelogPage = () => {
  const [versions, setVersions] = useState<ChangelogVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        const response = await fetch('/api/changelog');
        if (!response.ok) throw new Error('Failed to fetch changelog');
        const data = await response.json();
        setVersions(data.versions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchChangelog();
  }, []);

  if (loading) return <div className="p-4 text-gray-400">Loading changelog...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-mono mb-4 text-gray-200">Changelog</h1>
      <div className="space-y-1">
        {versions.map((version) => {
          const { added, removed } = calculateDiff(version.content, version.previousContent);
          const changedText = version.content !== version.previousContent ? (version.content || '').slice(0, 80) : '';
          return (
            <div key={version.id} className="flex items-center gap-3 py-1 text-sm font-mono">
              <span className="w-20 shrink-0 text-right">
                {added > 0 && <span className="text-green-500">+{added}</span>}
                {added > 0 && removed > 0 && <span className="text-gray-500">/</span>}
                {removed > 0 && <span className="text-red-500">-{removed}</span>}
                {added === 0 && removed === 0 && version.previousContent !== null && <span className="text-gray-500">±0</span>}
              </span>
              <span className="text-gray-500 w-12 text-right shrink-0">{formatRelativeTimestamp(version.createdAt)}</span>
              <Link href={`/songs/${version.id}`} className="text-gray-200 hover:underline shrink-0">
                {version.songTitle} / {version.label}
              </Link>
              <span className="text-gray-500 shrink-0">{version.createdBy || 'anonymous'}</span>
              {changedText && <span className={`truncate ${removed > added ? 'text-red-500' : 'text-green-500'}`}>{changedText}</span>}
              <Link href={`/changelog/${version.previousVersionId ?? ''}/${version.id}`} className="text-gray-400 hover:text-gray-200 text-sm">Compare</Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChangelogPage;
