import type { PreviewItem } from '../types';
import PreviewPanelItem from './PreviewPanelItem';

type Props = {
  previewItems: PreviewItem[];
  onVersionSelect: (sectionTitle: string, versionId: string | null) => void;
  onCompare: (item: PreviewItem, versionId: string, versionLabel: string, versionContent: string) => void;
};

const PreviewPanel = ({ previewItems, onVersionSelect, onCompare }: Props) => {
  return (
    <div className="w-80 space-y-2">
      <div className="text-xs font-semibold">Preview ({previewItems.length} sections):</div>
      {previewItems.length === 0 ? (
        <div className="text-xs text-gray-500">No sections found. Paste text with headings to see preview.</div>
      ) : (
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {previewItems.map((item, idx) => (
            <PreviewPanelItem key={idx} item={item} onSelectVersion={onVersionSelect} onCompare={onCompare} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;
