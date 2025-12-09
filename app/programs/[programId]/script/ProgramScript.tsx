import React from 'react';
import Link from 'next/link';
import sql from '@/lib/db';
import { getProgramById } from '@/lib/programsRepository';
import { CHORDMARK_STYLES } from '@/app/chordmark-converter/chordmarkStyles';

type Program = {
  id: string;
  title: string;
  elementIds: string[];
  programIds: string[];
};

type SongVersion = {
  id: string;
  songId: string;
  songTitle: string;
  label: string;
  content: string | null;
  renderedContent: {
    htmlLyricsOnly?: string;
    plainText?: string;
  } | null;
  tags?: string[];
};

type ProgramScriptProps = {
  programId: string;
};

async function loadProgramScriptData(programId: string) {
  const currentProgram = await getProgramById(programId);
  if (!currentProgram) {
    throw new Error('Program not found');
  }
  
  type ProgramRow = {
    id: string;
    title: string;
    element_ids: string[] | null;
    program_ids: string[] | null;
  };
  
  const allPrograms = await sql`
    select id, title, element_ids, program_ids
    from programs
    where archived = false
  ` as ProgramRow[];
  
  const programs: Program[] = allPrograms.map((p) => ({
    id: p.id,
    title: p.title,
    elementIds: p.element_ids ?? [],
    programIds: p.program_ids ?? [],
  }));
  
  const programMap: Record<string, Program> = {};
  programs.forEach((program) => {
    programMap[program.id] = program;
  });
  
  const collectVersionIds = (prog: Program | null, visited: Set<string> = new Set()): string[] => {
    if (!prog || visited.has(prog.id)) {
      return [];
    }
    visited.add(prog.id);
    
    const ids: string[] = [...prog.elementIds];
    prog.programIds.forEach((childId) => {
      const childProg = programMap[childId];
      if (childProg) {
        ids.push(...collectVersionIds(childProg, visited));
      }
    });
    return ids;
  };
  
  const versionIds = collectVersionIds(programMap[programId]);
  
  if (versionIds.length === 0) {
    return {
      program: {
        id: currentProgram.id,
        title: currentProgram.title,
        elementIds: currentProgram.elementIds,
        programIds: currentProgram.programIds,
      },
      programs,
      versions: {},
    };
  }
  
  type VersionRow = {
    id: string;
    song_id: string;
    song_title: string;
    label: string;
    content: string | null;
    rendered_content: { htmlLyricsOnly?: string; plainText?: string } | null;
    tags: string[] | null;
  };
  
  const versions = await sql`
    select 
      v.id, 
      v.song_id, 
      s.title as song_title,
      v.label,
      v.content,
      v.rendered_content,
      s.tags
    from song_versions v
    join songs s on v.song_id = s.id
    where v.id = ANY(${versionIds})
  ` as VersionRow[];
  
  const versionsMap: Record<string, SongVersion> = {};
  versions.forEach((v) => {
    versionsMap[v.id] = {
      id: v.id,
      songId: v.song_id,
      songTitle: v.song_title,
      label: v.label,
      content: v.content,
      renderedContent: v.rendered_content,
      tags: v.tags || [],
    };
  });
  
  return {
    program: {
      id: currentProgram.id,
      title: currentProgram.title,
      elementIds: currentProgram.elementIds,
      programIds: currentProgram.programIds,
    },
    programs,
    versions: versionsMap,
  };
}

const ProgramScript = async ({ programId }: ProgramScriptProps) => {
  let data;
  try {
    data = await loadProgramScriptData(programId);
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <div>Error: {error instanceof Error ? error.message : 'Failed to load program'}</div>
      </div>
    );
  }

  const programs: Program[] = data.programs || [];
  const versions: Record<string, SongVersion> = data.versions || {};
  const selectedProgram: Program | null = data.program || null;

  const programMap: Record<string, Program> = {};
  programs.forEach((program) => {
    programMap[program.id] = program;
  });

  if (!selectedProgram) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <div>Program not found</div>
      </div>
    );
  }
  type TocEntry =
    | { type: 'program'; program: Program; level: number }
    | { type: 'version'; version: SongVersion; level: number };
  const tocEntries: TocEntry[] = [];
  const tocStack = selectedProgram ? [{ program: selectedProgram, level: 0 }] : [];
  const tocVisited = new Set<string>();
  while (tocStack.length > 0) {
    const current = tocStack.pop();
    if (!current || tocVisited.has(current.program.id)) {
      continue;
    }
    tocVisited.add(current.program.id);
    const currentProgram = current.program;
    tocEntries.push({ type: 'program', program: currentProgram, level: current.level });
    currentProgram.elementIds.forEach((versionId) => {
      const version = versions[versionId];
      if (version) {
        tocEntries.push({ type: 'version', version, level: current.level + 1 });
      }
    });
    const childPrograms = currentProgram.programIds.map((childId) => programMap[childId]).filter(Boolean);
    for (let i = childPrograms.length - 1; i >= 0; i -= 1) {
      tocStack.push({ program: childPrograms[i], level: current.level + 1 });
    }
  }

  type ContentEntry =
    | { type: 'programHeading'; program: Program; level: number }
    | { type: 'version'; version: SongVersion; level: number };
  const contentEntries: ContentEntry[] = [];
  const contentStack = selectedProgram ? [{ program: selectedProgram, level: 0 }] : [];
  const contentVisited = new Set<string>();
  while (contentStack.length > 0) {
    const current = contentStack.pop();
    if (!current || contentVisited.has(current.program.id)) {
      continue;
    }
    contentVisited.add(current.program.id);
    const currentProgram = current.program;
    if (current.level > 0) {
      contentEntries.push({ type: 'programHeading', program: currentProgram, level: current.level });
    }
    currentProgram.elementIds.forEach((versionId) => {
      const version = versions[versionId];
      if (version) {
        contentEntries.push({ type: 'version', version, level: current.level });
      }
    });
    const childPrograms = currentProgram.programIds.map((childId) => programMap[childId]).filter(Boolean);
    for (let i = childPrograms.length - 1; i >= 0; i -= 1) {
      contentStack.push({ program: childPrograms[i], level: current.level + 1 });
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <style dangerouslySetInnerHTML={{ __html: CHORDMARK_STYLES }} />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl mb-8" style={{fontFamily: 'Georgia, serif'}}>
          {selectedProgram.title}
        </h1>
        {tocEntries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl mb-3" style={{fontFamily: 'Georgia, serif'}}>
              Contents
            </h2>
            <div className="space-y-1">
              {tocEntries.map((entry) =>
                entry.type === 'program' ? (
                  <div
                    key={`toc-program-${entry.program.id}`}
                    className="flex flex-col"
                    style={{ fontFamily: 'Georgia, serif', color: 'black', marginLeft: entry.level * 16 }}
                  >
                    <Link
                      href={`/programs/${entry.program.id}`}
                      className={`${entry.level === 0 ? 'text-3xl' : 'text-2xl'} hover:underline`}
                    >
                      {entry.program.title}
                    </Link>
                  </div>
                ) : (
                  <div
                    key={`toc-version-${entry.version.id}`}
                    className="ml-4"
                    style={{ fontFamily: 'Georgia, serif', color: 'black', marginLeft: entry.level * 16 }}
                  >
                    <Link href={`/songs/${entry.version.id}`} className="hover:underline">
                      {entry.version.songTitle}
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        )}
        {contentEntries.map((entry) => {
          if (entry.type === 'programHeading') {
            return (
              <h2
                key={`program-${entry.program.id}`}
                className="text-2xl mt-8 mb-4"
                id={`program-${entry.program.id}`}
                style={{fontFamily: 'Georgia, serif', marginLeft: entry.level * 16}}
              >
                <Link href={`/programs/${entry.program.id}`} className="hover:underline">
                  {entry.program.title}
                </Link>
              </h2>
            );
          }
          const version = entry.version;
          const isText = version.tags?.includes('text');
          const isSpeech = version.tags?.includes('speech');
          const showFullContent = isText || isSpeech;
          const chordmarkLyricsHtml = version.renderedContent?.htmlLyricsOnly;
          const fallbackText = (showFullContent && version.content) || version.renderedContent?.plainText || version.content || '';
          return (
            <div key={`version-${version.id}`} className="mb-8" id={`song-${version.id}`} style={{ marginLeft: entry.level * 16 }}>
              <h3 className="text-xl mb-2" style={{fontFamily: 'Georgia, serif'}}>
                <Link href={`/songs/${version.id}`} className="hover:underline">
                  {version.songTitle}
                </Link>
              </h3>
              {chordmarkLyricsHtml ? (
                <div className="styled-chordmark lyrics-wrap" dangerouslySetInnerHTML={{ __html: chordmarkLyricsHtml }} />
              ) : (
                fallbackText && (
                  <div className="whitespace-pre-wrap">{fallbackText}</div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgramScript;

