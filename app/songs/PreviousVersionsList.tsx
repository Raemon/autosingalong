import ChevronArrow from '@/app/components/ChevronArrow';
import { formatRelativeTimestamp } from '@/lib/dateUtils';
import type { SongVersion } from './types';

const calculateDiff = (content: string | null, previousContent: string | null) => {
  const currentLength = content?.length ?? 0;
  const previousLength = previousContent?.length ?? 0;
  if (previousContent === null) {
    return { added: currentLength, removed: 0 };
  }
  const diff = currentLength - previousLength;
  return { added: Math.max(0, diff), removed: Math.max(0, -diff) };
};

const PreviousVersionsList = ({previousVersions, currentVersion, isExpanded, onToggle, onVersionClick}: {
  previousVersions: SongVersion[];
  currentVersion: SongVersion;
  isExpanded: boolean;
  onToggle: () => void;
  onVersionClick: (version: SongVersion) => void;
}) => {
  if (previousVersions.length === 0) {
    return null;
  }

  // Build the version chain: current version first, then previous versions
  const allVersions = [currentVersion, ...previousVersions];

  return (
    <div className="mb-4">
      <button onClick={onToggle} className="text-xs text-gray-300 mb-2">
        <ChevronArrow isExpanded={isExpanded} className="mr-1" /> Version History ({previousVersions.length})
      </button>
      {isExpanded && (
        <div className="space-y-1">
          {allVersions.map((version, index) => {
            const previousVersion = allVersions[index + 1] ?? null;
            const { added, removed } = calculateDiff(version.content, previousVersion?.content ?? null);
            const changedText = version.content !== previousVersion?.content ? (version.content || '').slice(0, 60) : '';
            const isCurrent = index === 0;
            return (
              <div
                key={version.id}
                onClick={() => !isCurrent && onVersionClick(version)}
                className={`flex items-center gap-2 py-1 text-xs font-mono ${isCurrent ? 'text-gray-500' : 'cursor-pointer hover:bg-black'}`}
              >
                <span className="w-16 shrink-0 text-right">
                  {added > 0 && <span className="text-green-500">+{added}</span>}
                  {added > 0 && removed > 0 && <span className="text-gray-500">/</span>}
                  {removed > 0 && <span className="text-red-500">-{removed}</span>}
                  {added === 0 && removed === 0 && previousVersion !== null && <span className="text-gray-500">±0</span>}
                </span>
                <span className="text-gray-500 w-10 text-right shrink-0">{formatRelativeTimestamp(version.createdAt)}</span>
                <span className={`shrink-0 ${isCurrent ? 'text-gray-400' : 'text-gray-200'}`}>{version.label}{isCurrent && ' (current)'}</span>
                <span className="text-gray-500 shrink-0">{version.createdBy || 'anon'}</span>
                {changedText && <span className={`truncate ${removed > added ? 'text-red-400' : 'text-green-400'} opacity-50`}>{changedText}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PreviousVersionsList;

