import type { SongVersion } from './types';
import Tooltip from '../components/Tooltip';
import Link from 'next/link';

const VersionHeader = ({songTitle, version, showTitle = false}: {
  songTitle?: string;
  version: SongVersion;
  showTitle?: boolean;
}) => {
  const createdDate = new Date(version?.createdAt || '');
  return (
    <div className="flex items-end gap-4">
      {showTitle && songTitle && <h1 className="text-2xl font-georgia">{songTitle}</h1>}
      {version.label && <h1 className="text-[14px] font-mono hover:underline"><Link href={`/songs/${version.songId}/${version.id}`}>{version.label}</Link></h1>}
      <div className="text-sm flex items-center gap-1 text-gray-400">
        <Tooltip content={<div>Version last edited on {createdDate.toLocaleString()}<br/> by {version.createdBy ? version.createdBy : ''}</div>}>
          <span>{createdDate.toLocaleDateString()}</span>
        </Tooltip>
      </div>
    </div>
  );
};

export default VersionHeader;
