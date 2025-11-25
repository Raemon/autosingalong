import SongItem from './SongItem';
import type { Song, SongVersion } from './types';

const SongList = ({songs, selectedVersionId, onVersionClick, onCreateNewVersion}: {
  songs: Song[];
  selectedVersionId?: string;
  onVersionClick: (version: SongVersion) => void;
  onCreateNewVersion: (song: Song) => void;
}) => {
  return (
    <div className="grid grid-cols-[300px_1fr] gap-x-4">
      {songs.map((song) => (
        <SongItem
          key={song.id}
          song={song}
          selectedVersionId={selectedVersionId}
          onVersionClick={onVersionClick}
          onCreateNewVersion={onCreateNewVersion}
        />
      ))}
    </div>
  );
};

export default SongList;

