'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/app/contexts/UserContext';
import type { BackupInfo } from '@/app/api/admin/backup/list/route';
import type { BackupContents } from '@/app/api/admin/backup/contents/route';
import ChevronArrow from '@/app/components/ChevronArrow';

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const BackupsPage = () => {
  const { userId, isAdmin, loading: userLoading } = useUser();
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [restoringFile, setRestoringFile] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedBackup, setExpandedBackup] = useState<string | null>(null);
  const [backupContents, setBackupContents] = useState<Record<string, BackupContents>>({});
  const [loadingContents, setLoadingContents] = useState<string | null>(null);
  const [expandedSongs, setExpandedSongs] = useState<Set<string>>(new Set());

  const fetchBackups = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/admin/backup/list?requestingUserId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch backups');
      const data = await response.json();
      setBackups(data.backups);
    } catch (err) {
      console.error('Error fetching backups:', err);
      setStatus({ type: 'error', message: 'Failed to load backups' });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId && isAdmin) fetchBackups();
  }, [userId, isAdmin, fetchBackups]);

  const handleExpandBackup = async (filename: string) => {
    if (expandedBackup === filename) {
      setExpandedBackup(null);
      return;
    }
    setExpandedBackup(filename);
    if (backupContents[filename]) return; // Already loaded
    if (!userId) return;
    setLoadingContents(filename);
    try {
      const response = await fetch(`/api/admin/backup/contents?requestingUserId=${userId}&filename=${encodeURIComponent(filename)}`);
      if (!response.ok) throw new Error('Failed to fetch backup contents');
      const data = await response.json();
      setBackupContents(prev => ({ ...prev, [filename]: data }));
    } catch (err) {
      console.error('Error fetching backup contents:', err);
    } finally {
      setLoadingContents(null);
    }
  };

  const toggleSongExpanded = (songId: string) => {
    setExpandedSongs(prev => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  };

  const handleCreateBackup = async () => {
    if (!userId) return;
    setIsCreating(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/backup?requestingUserId=${userId}`, { method: 'POST' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create backup');
      }
      const blob = await response.blob();
      const filename = response.headers.get('X-Backup-Filename') || `songs-export-${new Date().toISOString().split('T')[0]}.zip`;
      const songsCount = response.headers.get('X-Songs-Count');
      const versionsCount = response.headers.get('X-Versions-Count');
      const programsCount = response.headers.get('X-Programs-Count');
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(downloadUrl);
      setStatus({ type: 'success', message: `Downloaded ${filename} (${songsCount} songs, ${versionsCount} versions, ${programsCount} programs)` });
      fetchBackups();
    } catch (err: unknown) {
      console.error('Backup failed:', err);
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (filename: string) => {
    if (!userId) return;
    const confirmed = window.confirm(
      `Are you sure you want to restore from "${filename}"?\n\nThis will DELETE all current songs, versions, and programs and replace them with the backup data. This action cannot be undone.`
    );
    if (!confirmed) return;

    setRestoringFile(filename);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/backup/restore?requestingUserId=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to restore backup');
      }
      setStatus({
        type: 'success',
        message: `Restored: ${data.restored.songs} songs, ${data.restored.versions} versions, ${data.restored.programs} programs`,
      });
    } catch (err: unknown) {
      console.error('Restore failed:', err);
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setRestoringFile(null);
    }
  };

  if (userLoading) {
    return <div className="p-8 text-gray-400">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="p-8 text-gray-400">You must be an admin to view this page.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Backups</h1>

      {status && (
        <div className={`mb-4 p-2 text-sm ${status.type === 'success' ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'}`}>
          {status.message}
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Create New Backup</h2>
        <p className="text-gray-400 text-sm mb-2">Download a zip file containing all songs, versions, blob files, and programs.</p>
        <button
          onClick={handleCreateBackup}
          disabled={isCreating}
          className={`text-sm px-3 py-1 border border-gray-600 rounded ${isCreating ? 'opacity-50 cursor-not-allowed' : 'text-gray-200 hover:bg-gray-800'}`}
        >
          {isCreating ? 'Creating...' : 'Create Backup'}
        </button>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Available Backups</h2>
        {isLoading ? (
          <div className="text-gray-400">Loading backups...</div>
        ) : backups.length === 0 ? (
          <div className="text-gray-500">No backups found in the backups/ directory.</div>
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => {
              const isExpanded = expandedBackup === backup.filename;
              const contents = backupContents[backup.filename];
              const isLoadingThis = loadingContents === backup.filename;
              return (
                <div key={backup.filename} className="border-b border-gray-700">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 flex items-center cursor-pointer" onClick={() => handleExpandBackup(backup.filename)}>
                      <ChevronArrow isExpanded={isExpanded} className="text-gray-500 mr-2" />
                      <span className="text-gray-200">{backup.filename}</span>
                      <span className="text-gray-500 text-sm ml-3">{formatFileSize(backup.size)}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRestore(backup.filename); }}
                      disabled={restoringFile !== null}
                      className={`text-sm px-3 py-1 border border-red-700 rounded ${restoringFile === backup.filename ? 'opacity-50 cursor-not-allowed' : 'text-red-400 hover:bg-red-900/30'}`}
                    >
                      {restoringFile === backup.filename ? 'Restoring...' : 'Restore'}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="pl-6 pb-3 text-sm">
                      {isLoadingThis ? (
                        <span className="text-gray-500">Loading contents...</span>
                      ) : contents ? (
                        <div>
                          <div className="text-gray-400 mb-1">{contents.songs.length} songs, {contents.programCount} programs</div>
                          <div className="space-y-1 max-h-64 overflow-y-auto">
                            {contents.songs.map(song => {
                              const isSongExpanded = expandedSongs.has(song.id);
                              return (
                                <div key={song.id}>
                                  <div className="flex items-center cursor-pointer hover:text-gray-200 text-gray-400" onClick={() => toggleSongExpanded(song.id)}>
                                    <ChevronArrow isExpanded={isSongExpanded} className="text-gray-600 mr-1" />
                                    <span>{song.title}</span>
                                    <span className="text-gray-600 ml-2">({song.versions.length})</span>
                                  </div>
                                  {isSongExpanded && (
                                    <div className="pl-5 text-gray-500">
                                      {song.versions.map(v => (
                                        <div key={v.id}>- {v.label}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default BackupsPage;
