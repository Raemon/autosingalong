import type { PreviewItem } from '../types';
import PreviewPanelItem from './PreviewPanelItem';

type Props = {
  previewItems: PreviewItem[];
  onVersionSelect: (sectionTitle: string, versionId: string | null) => void;
  onCompare: (item: PreviewItem, versionId: string, versionLabel: string, versionContent: string) => void;
};

const PreviewPanel = ({ previewItems, onVersionSelect, onCompare }: Props) => {
  return (
    <div className="w-full">
      <div className="text-sm font-semibold px-2 py-1 border-b border-gray-500">Preview ({previewItems.length} sections)</div>
      {previewItems.length === 0 ? (
        <div className="text-xs text-gray-500 px-2 py-2">No sections found. Paste text with headings to see preview.</div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto">
          {previewItems.map((item, idx) => (
            <PreviewPanelItem key={idx} item={item} onSelectVersion={onVersionSelect} onCompare={onCompare} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;
