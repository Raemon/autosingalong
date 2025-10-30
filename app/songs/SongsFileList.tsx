'use client';

import { useState, useEffect, Fragment } from 'react';
import SongItem from './SongItem';

type Song = {
  name: string;
  files: { name: string; size: number; mtime: string; }[];
};

const SongsFileList = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    console.log('fetchSongs');
    try {
      setLoading(true);
      console.log('fetching songs');
      const response = await fetch('/api/songs');
      console.log('response', response);
      if (!response.ok) throw new Error('Failed to fetch songs');
      console.log('response ok');
      const data = await response.json();
      setSongs(data.songs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
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
      <div className="max-w-5xl mx-auto">
        <h1 className="text-lg font-semibold mb-3">Songs</h1>
        
        <div className="grid grid-cols-[200px_1fr] gap-x-4">
          {songs.map((song) => (
            <Fragment key={song.name}>
              <SongItem
                song={song}
                onRefreshSongs={fetchSongs}
                renderName={true}
              />
              <SongItem
                song={song}
                onRefreshSongs={fetchSongs}
                renderFiles={true}
              />
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SongsFileList;

