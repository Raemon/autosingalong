import type { PreviewItem } from '../types';

type Props = {
  item: PreviewItem;
  idx: number;
  isExpanded: boolean;
  onToggleExpanded: (idx: number) => void;
  onSelectSong: (sectionTitle: string, songId: string, idx: number) => void;
};

const PreviewPanelItem = ({item, idx, isExpanded, onToggleExpanded, onSelectSong}: Props) => {
  const hasExactMatch = !!item.song;
  const hasCandidates = item.candidateSongs.length > 0;
  const hasSelection = !!item.selectedSongId;
  const selectedSong = hasSelection ? item.candidateSongs.find(c => c.song.id === item.selectedSongId)?.song : null;

  return (
    <div className="text-xs border border-gray-200 p-2">
      {hasExactMatch && !hasCandidates ? (
        <>
          <div className="text-green-600">✓ {item.sectionTitle}</div>
          <div className="mt-1 text-gray-400">Song: {item.song!.title}</div>
        </>
      ) : hasCandidates ? (
        <>
          <div className={`cursor-pointer ${hasExactMatch ? 'text-green-600' : 'text-yellow-600'}`} onClick={() => onToggleExpanded(idx)}>
            {hasExactMatch ? '✓' : '⚠'} {item.sectionTitle} {isExpanded ? '▼' : '▶'}
          </div>
          <div className="mt-1 space-y-1 p-1">
            {item.candidateSongs.map(candidate => {
              const isSelected = candidate.song.id === item.selectedSongId;
              return (
                <div key={candidate.song.id} className="space-y-0.5">
                  <div
                    className={`cursor-pointer hover:bg-gray-100 p-1 ${isSelected ? 'bg-green-100' : ''}`}
                    onClick={() => onSelectSong(item.sectionTitle, candidate.song.id, idx)}
                  >
                    {isSelected ? '●' : '○'} {candidate.song.title} ({candidate.similarity}%)
                  </div>
                  <div className="ml-4 text-gray-400 space-y-0.5">
                    {candidate.song.versions.map(version => (
                      <div key={version.id}>
                        - {version.label}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-yellow-600">new {item.sectionTitle}</div>
      )}
    </div>
  );
};

export default PreviewPanelItem;
