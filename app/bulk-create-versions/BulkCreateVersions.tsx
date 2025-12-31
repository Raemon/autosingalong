'use client';

import { useState, useMemo } from 'react';
import VersionSuffixInput from './components/VersionSuffixInput';
import ContentEditor from './components/ContentEditor';
import StatusMessage from './components/StatusMessage';
import ResultsList from './components/ResultsList';
import PreviewPanel from './components/PreviewPanel';
import { useSongs, useSections, useStatus, useProcessSections, usePreviewItems } from './hooks';
import { useUser } from '../contexts/UserContext';

const BulkCreateVersions = () => {
  const { canEdit, userName } = useUser();
  const [versionSuffix, setVersionSuffix] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [versionSelections, setVersionSelections] = useState<Map<string, string>>(new Map());

  const { songs, loadSongs } = useSongs();
  const sections = useSections(htmlContent);
  const { statusMessage, statusType, showStatus } = useStatus();
  const previewItems = usePreviewItems(sections, songs, versionSuffix, versionSelections);
  const effectiveSelections = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of previewItems) {
      if (item.selectedVersionId) map.set(item.sectionTitle, item.selectedVersionId);
    }
    return map;
  }, [previewItems]);
  const { isProcessing, results, processSections } = useProcessSections(songs, loadSongs, sections, versionSuffix, userName, effectiveSelections);

  const handleVersionSelection = (sectionTitle: string, versionId: string | null) => {
    setVersionSelections(prev => {
      const newMap = new Map(prev);
      newMap.set(sectionTitle, versionId === null ? '' : versionId);
      return newMap;
    });
  };

  return (
    <div className="flex gap-4 p-4">
      <div className="flex-1 space-y-4">
        <VersionSuffixInput value={versionSuffix} onChange={setVersionSuffix} />
        <ContentEditor onContentChange={setHtmlContent} showStatus={showStatus} />
        <StatusMessage message={statusMessage} type={statusType} />
        {canEdit && (
          <button
            onClick={processSections}
            disabled={isProcessing}
            className="text-xs px-2 py-1 bg-blue-600 text-white disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Process Sections'}
          </button>
        )}
        <ResultsList results={results} />
      </div>
      <PreviewPanel previewItems={previewItems} onVersionSelect={handleVersionSelection} />
    </div>
  );
};

export default BulkCreateVersions;
