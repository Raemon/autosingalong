'use client';

import { useState, useEffect, Fragment } from 'react';
import { marked } from 'marked';
import SongItem from './SongItem';
import type { Song, SongVersion } from './types';

const VersionContent = ({version}: {version: SongVersion}) => {
  const hasAudio = Boolean(version.audioUrl);
  const hasContent = Boolean(version.content);
  const isTxtFile = version.label.toLowerCase().endsWith('.txt');

  if (!hasAudio && !hasContent) {
    return <p className="text-gray-500 text-xs">No stored content for this version.</p>;
  }

  return (
    <div className="space-y-2">
      {hasAudio && (
        <audio controls src={version.audioUrl || undefined} className="w-full">
          Your browser does not support the audio element.
        </audio>
      )}
      {hasContent && (
        isTxtFile ? (
          <pre className="text-content text-gray-800 text-xs overflow-x-auto">{version.content}</pre>
        ) : (
          <div 
            className="markdown-content text-gray-800 text-xs"
            dangerouslySetInnerHTML={{ __html: marked.parse(version.content || '') }}
          />
        )
      )}
    </div>
  );
};

const SongsFileList = () => {
  console.log('SongsFileList component rendering');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<SongVersion | null>(null);

  const fetchSongs = async () => {
    console.log('fetchSongs called');
    try {
      setLoading(true);
      console.log('About to fetch from /api/songs');
      const response = await fetch('/api/songs');
      console.log('Got response:', response.status, response.statusText);
      if (!response.ok) {
        console.error('Response not OK:', response.status);
        throw new Error(`Failed to fetch songs: ${response.status}`);
      }
      console.log('Response OK, parsing JSON');
      const data = await response.json();
      console.log('Parsed data:', data);
      setSongs(data.songs);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const filteredSongs = songs.filter(song => {
    const searchLower = searchTerm.toLowerCase();
    if (song.title.toLowerCase().includes(searchLower)) {
      return true;
    }
    return song.versions.some(version =>
      version.label.toLowerCase().includes(searchLower) ||
      (version.content && version.content.toLowerCase().includes(searchLower))
    );
  });

  const handleVersionClick = (version: SongVersion) => {
    setSelectedVersion(prev => prev?.id === version.id ? null : version);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-gray-600">Loading songs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="flex gap-4 h-[calc(100vh-2rem)] mx-auto max-w-7xl">
        <div className="flex-1 overflow-y-auto max-w-md">
          <input
            type="text"
            placeholder="Search songs or versions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-3 px-2 py-1 w-full max-w-md"
          />
          
          <div className="grid grid-cols-[200px_1fr] gap-x-4">
            {filteredSongs.map((song) => (
              <Fragment key={song.id}>
                <SongItem
                  song={song}
                  renderName={true}
                />
                <SongItem
                  song={song}
                  renderFiles={true}
                  selectedVersionId={selectedVersion?.id}
                  onVersionClick={handleVersionClick}
                />
              </Fragment>
            ))}
          </div>
        </div>
        
        {selectedVersion && (
          <div className="w-96 border-l border-gray-200 pl-4 overflow-y-auto">
            <div className="mb-2">
              <button
                onClick={() => setSelectedVersion(null)}
                className="text-gray-400 text-xs mb-2"
              >
                × Close
              </button>
              <h3 className="font-mono text-sm font-medium text-gray-800 mb-1">
                {selectedVersion.label}
              </h3>
              <p className="text-gray-400 text-xs">
                {new Date(selectedVersion.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
            <VersionContent version={selectedVersion} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SongsFileList;
