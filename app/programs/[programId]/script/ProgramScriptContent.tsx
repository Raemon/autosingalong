'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import VersionContent from '@/app/songs/VersionContent';
import { TableOfContents } from './TableOfContents';
import type { SongVersion } from '@/app/songs/types';

type Program = {
  id: string;
  title: string;
  elementIds: string[];
  programIds: string[];
  isSubprogram: boolean;
};

type ScriptSongVersion = SongVersion & {
  songTitle: string;
  tags?: string[];
};

type Entry = 
  | { type: 'program'; program: Program; level: number }
  | { type: 'programHeading'; program: Program; level: number }
  | { type: 'version'; version: ScriptSongVersion; level: number };

type ProgramScriptContentProps = {
  programId: string;
  contentEntries: Entry[];
  tocEntries: Entry[];
};

const ProgramScriptContent = ({ programId, contentEntries, tocEntries }: ProgramScriptContentProps) => {
  const [showSongs, setShowSongs] = useState(true);
  const [showSpeeches, setShowSpeeches] = useState(true);
  const [showActivities, setShowActivities] = useState(true);

  const getVersionCategory = (version: ScriptSongVersion): 'song' | 'speech' | 'activity' => {
    const tags = version.tags || [];
    if (tags.includes('speech')) return 'speech';
    if (tags.includes('activity')) return 'activity';
    return 'song';
  };

  const shouldShowVersion = (version: ScriptSongVersion): boolean => {
    const category = getVersionCategory(version);
    if (category === 'song') return showSongs;
    if (category === 'speech') return showSpeeches;
    if (category === 'activity') return showActivities;
    return true;
  };

  const filterEntries = (entries: Entry[]) => entries.filter(entry => {
    if (entry.type === 'version') {
      return shouldShowVersion(entry.version);
    }
    return true;
  });

  const filteredContentEntries = filterEntries(contentEntries);
  const filteredTocEntries = filterEntries(tocEntries);

  return (
    <>
      <div className="max-w-lg p-8 font-georgia lg:fixed lg:top-[50px] lg:left-0 lg:max-h-[calc(100vh-50px)] lg:overflow-y-auto print:static print:max-w-none print:w-full print:top-auto print:left-auto" style={{ breakAfter: 'page' }}>
        <div className="flex gap-2 mb-4 text-sm print:hidden">
          <button onClick={() => setShowSongs(!showSongs)} className={`px-2 py-0.5 border border-black rounded-sm ${showSongs ? 'opacity-100' : 'opacity-50'}`}>
            Songs {showSongs ? '✓' : '○'}
          </button>
          <button onClick={() => setShowSpeeches(!showSpeeches)} className={`px-2 py-0.5 border border-black rounded-sm ${showSpeeches ? 'opacity-100' : 'opacity-50'}`}>
            Speeches {showSpeeches ? '✓' : '○'}
          </button>
          <button onClick={() => setShowActivities(!showActivities)} className={`px-2 py-0.5 border border-black rounded-sm ${showActivities ? 'opacity-100' : 'opacity-50'}`}>
            Activities {showActivities ? '✓' : '○'}
          </button>
        </div>
        {filteredTocEntries.length > 0 && (
          <TableOfContents entries={filteredTocEntries} programId={programId} />
        )}
      </div>
      <div className="max-w-2xl p-8 font-georgia print:max-w-none print:w-full flex flex-col gap-8">
        {filteredContentEntries.map((entry) => {
          if (entry.type === 'programHeading') {
            return (
              <h2
                key={`heading-${entry.program.id}`}
                className="text-4xl mt-8 mb-4 font-semibold"
                id={`program-${entry.program.id}`}
                style={{ marginLeft: entry.level * 16 }}
              >
                <Link href={`/programs/${entry.program.id}`} className="hover:underline">
                  {entry.program.title}
                </Link>
              </h2>
            );
          }

          if (entry.type === 'version') {
            const { version } = entry;
            
            return (
              <div 
                key={`song-${version.id}`} 
                className="mb-8" 
                id={`song-${version.id}`}
                style={{ marginLeft: entry.level * 16 }}
              >
                <h3 className="text-xl mb-2 font-semibold">
                  <Link href={`/programs/${programId}?songId=${version.id}`} className="hover:underline">
                    {version.songTitle}
                  </Link>
                </h3>
                
                <VersionContent version={version} print={true} />
              </div>
            );
          }
          
          return null;
        })}
      </div>
    </>
  );
};

export default ProgramScriptContent;
