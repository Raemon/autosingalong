'use client';

import { useCallback, useState } from 'react';
import type { Song } from './types';
import Tooltip from '../components/Tooltip';
import { generateSongsExportZip } from '@/lib/exportUtils';

type DownloadAllSongsButtonProps = {
  className?: string;
};

const DownloadAllSongsButton = ({ className = '' }: DownloadAllSongsButtonProps) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadAllSongs = useCallback(async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch('/api/songs/export');
      if (!response.ok) {
        throw new Error(`Failed to fetch songs for export: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      const songsForExport: Song[] = Array.isArray(data?.songs) ? data.songs : [];
      if (!songsForExport.length) {
        throw new Error('No songs available to export');
      }

      const blob = await generateSongsExportZip(songsForExport);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `songs-export-${new Date().toISOString().split('T')[0]}.zip`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download export failed:', error);
      setDownloadError(error instanceof Error ? error.message : 'Failed to export songs');
    } finally {
      setDownloading(false);
    }
  }, []);

  return (
    <Tooltip content={"Download all songs"} placement="bottom">  
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={handleDownloadAllSongs}
          disabled={downloading}
          className={`text-xs px-2 py-1 border border-gray-600 rounded whitespace-nowrap ${
            downloading ? 'opacity-50 cursor-not-allowed' : 'text-gray-200 hover:bg-gray-800'
          }`}
        >
          {downloading ? 'Preparing…' : 'Download'}
        </button>
        {downloadError && (
          <div className="text-xs text-red-400">
            {downloadError}
          </div>
        )}
      </div>
    </Tooltip>
  );
};

export default DownloadAllSongsButton;

