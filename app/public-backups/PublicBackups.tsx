'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PublicBackupInfo } from '@/app/api/public-backups/route';

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr: string | Date) => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const GITHUB_ACTIONS_URL = 'https://github.com/Raemon/autosingalong/actions/workflows/public-backup.yml';

const PublicBackups = () => {
  const [backups, setBackups] = useState<PublicBackupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchBackups = useCallback(async () => {
    try {
      const response = await fetch('/api/public-backups');
      if (!response.ok) throw new Error('Failed to fetch backups');
      const data = await response.json();
      setBackups(data.backups);
    } catch (err) {
      console.error('Error fetching backups:', err);
      setStatus({ type: 'error', message: 'Failed to load backups' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleTriggerBackup = async () => {
    const confirmed = window.confirm('Trigger a new public backup?\n\nThis will run a GitHub Action that creates a public export of all songs.');
    if (!confirmed) return;
    setIsTriggering(true);
    setStatus(null);
    try {
      const response = await fetch('/api/public-backups/trigger', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to trigger backup');
      setStatus({ type: 'success', message: 'Backup workflow triggered! Check GitHub Actions for progress.' });
    } catch (err) {
      console.error('Trigger failed:', err);
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Public Backups</h1>

      <p className="text-gray-400 text-sm mb-4">
        Public backups are created daily via{' '}
        <a href={GITHUB_ACTIONS_URL} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
          GitHub Actions
        </a>{' '}
        and contain an export of all songs. These are publicly downloadable.
      </p>

      <button
        onClick={handleTriggerBackup}
        disabled={isTriggering}
        className={`mb-6 px-4 py-2 text-sm border border-blue-600 ${isTriggering ? 'opacity-50 cursor-not-allowed' : 'text-blue-400 hover:bg-blue-900/30'}`}
      >
        {isTriggering ? 'Triggering...' : 'Create New Backup'}
      </button>

      {status && (
        <div className={`mb-4 p-2 text-sm ${status.type === 'success' ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'}`}>
          {status.message}
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Available Backups</h2>
        {isLoading ? (
          <div className="text-gray-400">Loading backups...</div>
        ) : backups.length === 0 ? (
          <div className="text-gray-500">No public backups found.</div>
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => (
              <div key={backup.filename} className="border-b border-gray-700 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="text-gray-200">{backup.filename}</span>
                    <span className="text-gray-500 text-sm ml-3">{formatFileSize(backup.size)}</span>
                    <span className="text-gray-500 text-sm ml-3">{formatDate(backup.lastModified)}</span>
                  </div>
                  <a
                    href={backup.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-3 py-1 border border-gray-600 text-gray-200 hover:bg-gray-800"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PublicBackups;
