'use client';

import type { Song, SongVersion } from './types';

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const VersionRow = ({version, isSelected, onClick}: {
  version: SongVersion;
  isSelected: boolean;
  onClick: () => void;
}) => {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-2 py-1 cursor-pointer ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
    >
      <span className={`flex-1 font-mono text-sm min-w-0 ${isSelected ? 'font-medium' : ''}`}>
        <span className="text-gray-800">{version.label}</span>
      </span>
      <span className="text-gray-400 text-xs w-24">{formatDate(version.createdAt)}</span>
    </div>
  );
};

const SongItem = ({song, renderName, renderFiles, selectedVersionId, onVersionClick}: {
  song: Song;
  renderName?: boolean;
  renderFiles?: boolean;
  selectedVersionId?: string;
  onVersionClick?: (version: SongVersion) => void;
}) => {
  if (renderName) {
    return (
      <div className="px-2 py-1 text-base font-medium border-b border-gray-200 font-georgia">
        {song.title.replace(/_/g, ' ')}
      </div>
    );
  }

  if (renderFiles) {
    if (song.versions.length === 0) {
      return (
        <div className="border-b border-gray-200">
          <p className="px-2 py-1 text-xs text-gray-500">No versions stored yet.</p>
        </div>
      );
    }

    return (
      <div className="border-b border-gray-200">
        {song.versions.map((version) => (
          <VersionRow
            key={version.id}
            version={version}
            isSelected={selectedVersionId === version.id}
            onClick={() => onVersionClick?.(version)}
          />
        ))}
      </div>
    );
  }

  return null;
};

export default SongItem;
