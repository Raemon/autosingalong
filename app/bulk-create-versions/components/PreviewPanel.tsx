import { useState } from 'react';
import type { PreviewItem } from '../types';
import PreviewPanelItem from './PreviewPanelItem';

type Props = {
  previewItems: PreviewItem[];
  onSongSelect: (sectionTitle: string, songId: string | null) => void;
};

const PreviewPanel = ({ previewItems, onSongSelect }: Props) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpanded = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const handleSelectSong = (sectionTitle: string, songId: string, idx: number) => {
    onSongSelect(sectionTitle, songId);
    setExpandedIndex(null);
  };

  return (
    <div className="w-80 space-y-2">
      <div className="text-xs font-semibold">Preview ({previewItems.length} sections):</div>
      {previewItems.length === 0 ? (
        <div className="text-xs text-gray-500">No sections found. Paste text with headings to see preview.</div>
      ) : (
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {previewItems.map((item, idx) => (
            <PreviewPanelItem
              key={idx}
              item={item}
              idx={idx}
              isExpanded={expandedIndex === idx}
              onToggleExpanded={toggleExpanded}
              onSelectSong={handleSelectSong}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;
