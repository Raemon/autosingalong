import type { PreviewItem } from '../types';

type Props = {
  item: PreviewItem;
  onSelectVersion: (sectionTitle: string, versionId: string | null) => void;
};

const PreviewPanelItem = ({item, onSelectVersion}: Props) => {
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
                  <div
                    key={version.id}
                    className={`cursor-pointer p-0.5 ${isSelected ? 'text-white bg-gray-600' : 'text-gray-400'}`}
                    onClick={() => onSelectVersion(item.sectionTitle, version.id)}
                  >
                    {isSelected ? '●' : '○'} {version.label}
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
