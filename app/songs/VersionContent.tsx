import { marked } from 'marked';
import type { SongVersion } from './types';
import ChordmarkRenderer from '../chordmark-converter/ChordmarkRenderer';

const VersionContent = ({version}: {
  version: SongVersion;
}) => {
  const hasAudio = Boolean(version.audioUrl);
  const hasContent = Boolean(version.content);
  const isTxtFile = version.label.toLowerCase().endsWith('.txt');
  const isChordmarkFile = version.label.toLowerCase().endsWith('.chordmark');

  if (!hasAudio && !hasContent) {
    return <p className="text-gray-500 text-xs">No stored content for this version.</p>;
  }

  return (
    <div className="space-y-2">
      {hasAudio && (
        <audio controls src={version.audioUrl || undefined} className="w-full">
          Your browser does not support the audio element.
        </audio>
      )}
      {hasContent && (
        isChordmarkFile ? (
          <ChordmarkRenderer content={version.content || ''} />
        ) : isTxtFile ? (
          <pre className="text-content text-gray-800 text-xs overflow-x-auto">{version.content}</pre>
        ) : (
          <div 
            className="markdown-content text-gray-800 text-xs"
            dangerouslySetInnerHTML={{ __html: marked.parse(version.content || '', { breaks: true }) as string }}
          />
        )
      )}
    </div>
  );
};

export default VersionContent;


