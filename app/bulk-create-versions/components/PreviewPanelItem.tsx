import type { PreviewItem } from '../types';

type Props = {
  item: PreviewItem;
  onSelectVersion: (itemKey: string, versionId: string | null) => void;
  onToggleDontImport: (itemKey: string) => void;
  onCompare: (item: PreviewItem, versionId: string, versionLabel: string, versionContent: string) => void;
};

const PreviewPanelItem = ({item, onSelectVersion, onToggleDontImport, onCompare}: Props) => {
  const isNewSong = item.candidateSong === null;
  const songTitle = isNewSong ? 'Create new song' : item.candidateSong.song.title;
  const similarity = isNewSong ? null : item.candidateSong.similarity;
  const versions = isNewSong ? [] : item.candidateSong.song.versions;

  return (
    <div className={`border-b border-gray-500/50 ${item.dontImport ? 'opacity-50 bg-gray-800/30' : 'bg-gray-800/60'}`}>
      <div className="flex items-center gap-2 px-2 py-1">
        <span className="text-[11px] text-gray-300 font-mono flex-1">
          → {songTitle}{similarity !== null && ` (${similarity}%)`}
        </span>
        <div
          onClick={() => onToggleDontImport(item.itemKey)}
          className={`cursor-pointer text-xs font-mono ${item.dontImport ? 'text-red-400' : 'text-gray-400 hover:text-gray-200'}`}
        >
          {item.dontImport ? '● skip' : '○ skip'}
        </div>
      </div>
      {!isNewSong && !item.dontImport && (
        <div className="px-2 pb-1">
          {versions.map(version => {
            const isSelected = version.id === item.selectedVersionId;
            return (
              <div
                key={version.id}
                onClick={() => onSelectVersion(item.itemKey, version.id)}
                className={`flex items-center gap-2 py-[1px] cursor-pointer ${isSelected ? 'text-primary' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <span className="font-mono text-xs">
                  {isSelected ? '●' : '○'} {version.label}
                </span>
                <button
                  className="text-blue-400 hover:text-blue-300 text-xs ml-auto"
                  onClick={(e) => { e.stopPropagation(); onCompare(item, version.id, version.label, version.content || ''); }}
                >
                  diff
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PreviewPanelItem;
