'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { groupBy, map } from 'lodash';
import MyTooltip from '@/app/components/Tooltip';
import { formatRelativeTimestamp } from '@/lib/dateUtils';
import type { Song, SongVersion } from './songs/types';
import SongItem from './songs/SongItem';


const RecentSongs = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/songs?limit=10')
      .then(res => res.json())
      .then(data => { setSongs(data.songs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>;
  if (!songs.length) return <div className="text-gray-400 text-sm">No recent songs</div>;

  return (
    <div>
      {songs.map(song => {
        const tagsMinusSong = song.tags.filter(tag => tag !== 'song');
        // Group versions by label and get the most recent version for each label
        const versionsByLabel = groupBy(song.versions, 'label');
        const mostRecentVersions = map(versionsByLabel, versions => 
          versions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        );
        return (
          <SongItem key={song.id} song={song} selectedVersionId={mostRecentVersions[0]?.id} selectedSongId={song.id} onSongClick={() => {}} onVersionClick={() => {}} onCreateNewVersion={() => {}} showTags={false} maxVersions={3} />
        );
      })}
    </div>
  );
};

export default RecentSongs;