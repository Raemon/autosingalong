import type { PreviewItem } from '../types';

type Props = {
  item: PreviewItem;
  onSelectVersion: (sectionTitle: string, versionId: string | null) => void;
  onCompare: (item: PreviewItem, versionId: string, versionLabel: string, versionContent: string) => void;
};

const PreviewPanelItem = ({item, onSelectVersion, onCompare}: Props) => {
  const isNewSong = !item.selectedVersionId;

  return (
    <div className="text-xs p-2">
      <div className="text-gray-400">{item.sectionTitle}</div>
      <div className="mt-1 space-y-0.5 ml-2">
        <div
          className={`cursor-pointer p-0.5 ${isNewSong ? 'text-white bg-gray-600' : 'text-gray-400'}`}
          onClick={() => onSelectVersion(item.sectionTitle, null)}
        >
          {isNewSong ? '●' : '○'} Create new song
        </div>
        {item.candidateSongs.map(candidate => (
          <div key={candidate.song.id}>
            <div className="text-gray-400">{candidate.song.title} ({candidate.similarity}%)</div>
            <div className="ml-2 space-y-0.5">
              {candidate.song.versions.map(version => {
                const isSelected = version.id === item.selectedVersionId;
                return (
                  <div key={version.id} className="flex items-center gap-1">
                    <div
                      className={`cursor-pointer p-0.5 flex-1 ${isSelected ? 'text-white bg-gray-600' : 'text-gray-400'}`}
                      onClick={() => onSelectVersion(item.sectionTitle, version.id)}
                    >
                      {isSelected ? '●' : '○'} {version.label}
                    </div>
                    <button
                      className="text-blue-400 hover:text-blue-300 px-1"
                      onClick={() => onCompare(item, version.id, version.label, version.content || '')}
                    >
                      diff
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviewPanelItem;
