'use client';

import { useState, useEffect, Fragment } from 'react';
import SongItem from './SongItem';

type Song = {
  name: string;
  files: { name: string; size: number; mtime: string; }[];
};

const SongsFileList = () => {
  console.log('SongsFileList component rendering');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    if (song.name.toLowerCase().includes(searchLower)) {
      return true;
    }
    return song.files.some(file => 
      file.name.toLowerCase().includes(searchLower)
    );
  });

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
        <input
          type="text"
          placeholder="Search songs or files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-3 px-2 py-1 w-full max-w-md"
        />
        
        <div className="grid grid-cols-[200px_1fr] gap-x-4">
          {filteredSongs.map((song) => (
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

