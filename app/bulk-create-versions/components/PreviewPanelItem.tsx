import type { PreviewItem } from '../types';

type Props = {
  item: PreviewItem;
  onSelectVersion: (sectionTitle: string, versionId: string | null) => void;
  onCompare: (item: PreviewItem, versionId: string, versionLabel: string, versionContent: string) => void;
};

const PreviewPanelItem = ({item, onSelectVersion, onCompare}: Props) => {
  const isNewSong = !item.selectedVersionId;
  const candidateNames = item.candidateSongs.map(c => `${c.song.title} (${c.similarity}%)`).join(', ');

  return (
    <div className="flex">
      <div className="w-1/2 px-2 py-1 text-lg font-medium border-b border-gray-500 font-georgia">
        <div className="flex flex-col">
          <span>{item.sectionTitle}</span>
          {candidateNames && <span className="text-[10px] text-gray-400 font-mono">{candidateNames}</span>}
        </div>
      </div>
      <div className="border-b py-1 border-gray-500 w-1/2 flex flex-col justify-center">
        <div
          onClick={() => onSelectVersion(item.sectionTitle, null)}
          className={`flex items-center gap-3 px-2 py-[2px] cursor-pointer ${isNewSong ? 'text-primary' : 'hover:bg-black/50'}`}
        >
          <span className={`flex-1 font-mono min-w-0 ${isNewSong ? 'font-medium' : ''}`} style={{fontSize: '12px'}}>
            <span className={isNewSong ? 'text-primary' : 'text-gray-300'}>{isNewSong ? '● ' : '○ '}Create new element</span>
          </span>
        </div>
        {item.candidateSongs.flatMap(candidate =>
          candidate.song.versions.map(version => {
            const isSelected = version.id === item.selectedVersionId;
            return (
              <div
                key={version.id}
                onClick={() => onSelectVersion(item.sectionTitle, version.id)}
                className={`flex items-center gap-3 px-2 py-[2px] cursor-pointer ${isSelected ? 'text-primary' : 'hover:bg-black/50'}`}
              >
                <span className={`flex-1 font-mono min-w-0 ${isSelected ? 'font-medium' : ''}`} style={{fontSize: '12px'}}>
                  <span className={isSelected ? 'text-primary' : 'text-gray-300'}>{isSelected ? '● ' : '○ '}{version.label}</span>
                </span>
                <button
                  className="text-blue-400 hover:text-blue-300 text-xs"
                  onClick={(e) => { e.stopPropagation(); onCompare(item, version.id, version.label, version.content || ''); }}
                >
                  diff
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PreviewPanelItem;
