import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { promises as fs } from 'fs';
import path from 'path';
import JSZip from 'jszip';
import sql from '@/lib/db';

export type RestoreProgress = {
  step: string;
  completed: boolean;
  error?: string;
  details?: { songs: number; versions: number; programs: number };
  progress?: { current: number; total: number };
};

type SongVersionData = {
  id: string;
  songId: string;
  label: string;
  content: string | null;
  audioUrl: string | null;
  slidesMovieUrl: string | null;
  slideMovieStart: number | null;
  previousVersionId: string | null;
  nextVersionId: string | null;
  originalVersionId: string | null;
  renderedContent: object | null;
  bpm: number | null;
  transpose: number | null;
  archived: boolean;
  createdBy: string | null;
  createdAt: string;
  dbCreatedAt: string;
  slideCredits: string | null;
  programCredits: string | null;
  blobUrl: string | null;
};

type ProgramData = {
  id: string;
  title: string;
  elementIds: string[];
  programIds: string[];
  createdBy: string | null;
  createdAt: string;
  archived: boolean;
  isSubprogram: boolean;
  videoUrl: string | null;
  printProgramForeword: string | null;
  printProgramEpitaph: string | null;
};

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestingUserId = searchParams.get('requestingUserId');
  const adminError = await requireAdmin(requestingUserId);
  if (adminError) return adminError;

  const body = await request.json();
  const { filename } = body;
  if (!filename || typeof filename !== 'string') {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  const sanitizedFilename = path.basename(filename);
  if (!sanitizedFilename.endsWith('.zip')) {
    return NextResponse.json({ error: 'Invalid backup file' }, { status: 400 });
  }

  const backupPath = path.join(process.cwd(), 'backups', sanitizedFilename);
  let zipBuffer: Buffer;
  try {
    zipBuffer = await fs.readFile(backupPath);
  } catch {
    return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (progress: RestoreProgress) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(progress)}\n\n`));
      };

      try {
        sendProgress({ step: 'Loading backup file...', completed: false });
        const zip = await JSZip.loadAsync(zipBuffer);

        sendProgress({ step: 'Parsing backup structure...', completed: false });
        const songs: { id: string; title: string; tags: string[]; createdBy: string | null; createdAt: string }[] = [];
        const versions: SongVersionData[] = [];
        const programs: ProgramData[] = [];

        const songFolderPattern = /^songs_export\/([^/]+)___([^/]+)\/$/;
        const versionDataPattern = /^songs_export\/[^/]+___([^/]+)\/versions\/([^/]+)___([^/]+)\/data\.json$/;
        const programsDataPattern = /^songs_export\/programs\/data\.json$/;

        const songFolders = new Set<string>();
        for (const filePath of Object.keys(zip.files)) {
          const folderMatch = filePath.match(songFolderPattern);
          if (folderMatch) {
            songFolders.add(filePath);
          }
        }

        for (const folderPath of songFolders) {
          const match = folderPath.match(/^songs_export\/(.+)___([^/]+)\/$/);
          if (match) {
            const title = match[1];
            const songId = match[2];
            songs.push({ id: songId, title, tags: ['song'], createdBy: null, createdAt: new Date().toISOString() });
          }
        }

        for (const [filePath, file] of Object.entries(zip.files)) {
          const versionMatch = filePath.match(versionDataPattern);
          if (versionMatch) {
            const content = await file.async('string');
            try {
              const versionData = JSON.parse(content) as SongVersionData;
              versions.push(versionData);
              const song = songs.find(s => s.id === versionData.songId);
              if (song && versionData.createdAt) {
                if (new Date(versionData.createdAt) < new Date(song.createdAt)) {
                  song.createdAt = versionData.createdAt;
                }
              }
            } catch (e) {
              console.warn(`Failed to parse version data at ${filePath}:`, e);
            }
          }
          if (programsDataPattern.test(filePath)) {
            const content = await file.async('string');
            try {
              const programsData = JSON.parse(content) as ProgramData[];
              programs.push(...programsData);
            } catch (e) {
              console.warn('Failed to parse programs data:', e);
            }
          }
        }

        sendProgress({ step: 'Deleting existing data...', completed: false });
        await sql`DELETE FROM song_versions WHERE 1=1`;
        await sql`DELETE FROM songs WHERE 1=1`;
        await sql`DELETE FROM programs WHERE 1=1`;

        for (let i = 0; i < songs.length; i++) {
          const song = songs[i];
          if (i % 10 === 0 || i === songs.length - 1) {
            sendProgress({ step: `Inserting songs...`, completed: false, progress: { current: i + 1, total: songs.length } });
          }
          await sql`
            INSERT INTO songs (id, title, tags, created_by, created_at, archived)
            VALUES (${song.id}, ${song.title}, ${song.tags}::text[], ${song.createdBy}, ${song.createdAt}, false)
            ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, tags = EXCLUDED.tags
          `;
        }

        for (let i = 0; i < versions.length; i++) {
          const version = versions[i];
          if (i % 10 === 0 || i === versions.length - 1) {
            sendProgress({ step: `Inserting versions...`, completed: false, progress: { current: i + 1, total: versions.length } });
          }
          await sql`
            INSERT INTO song_versions (
              id, song_id, label, content, audio_url, slides_movie_url, slide_movie_start,
              previous_version_id, next_version_id, original_version_id, rendered_content,
              bpm, transpose, archived, created_by, created_at, db_created_at,
              slide_credits, program_credits, blob_url
            ) VALUES (
              ${version.id}, ${version.songId}, ${version.label}, ${version.content},
              ${version.audioUrl}, ${version.slidesMovieUrl}, ${version.slideMovieStart},
              ${null}, ${null}, ${null},
              ${version.renderedContent ? JSON.stringify(version.renderedContent) : null}::jsonb,
              ${version.bpm}, ${version.transpose}, ${version.archived}, ${version.createdBy},
              ${version.createdAt}, ${version.dbCreatedAt || version.createdAt},
              ${version.slideCredits}, ${version.programCredits}, ${version.blobUrl}
            )
          `;
        }

        const versionsWithRefs = versions.filter(v => v.previousVersionId || v.nextVersionId || v.originalVersionId);
        for (let i = 0; i < versionsWithRefs.length; i++) {
          const version = versionsWithRefs[i];
          if (i % 10 === 0 || i === versionsWithRefs.length - 1) {
            sendProgress({ step: `Updating version references...`, completed: false, progress: { current: i + 1, total: versionsWithRefs.length } });
          }
          await sql`
            UPDATE song_versions SET
              previous_version_id = ${version.previousVersionId},
              next_version_id = ${version.nextVersionId},
              original_version_id = ${version.originalVersionId}
            WHERE id = ${version.id}
          `;
        }

        for (let i = 0; i < programs.length; i++) {
          const program = programs[i];
          if (i % 5 === 0 || i === programs.length - 1) {
            sendProgress({ step: `Inserting programs...`, completed: false, progress: { current: i + 1, total: programs.length } });
          }
          await sql`
            INSERT INTO programs (
              id, title, element_ids, program_ids, created_by, created_at, archived,
              is_subprogram, video_url, print_program_foreword, print_program_epitaph
            ) VALUES (
              ${program.id}, ${program.title}, ${program.elementIds}::uuid[],
              ${program.programIds}::uuid[], ${program.createdBy}, ${program.createdAt},
              ${program.archived}, ${program.isSubprogram}, ${program.videoUrl},
              ${program.printProgramForeword}, ${program.printProgramEpitaph}
            )
          `;
        }

        sendProgress({
          step: 'Done!',
          completed: true,
          details: { songs: songs.length, versions: versions.length, programs: programs.length },
        });
        controller.close();
      } catch (error) {
        console.error('Restore backup failed:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        sendProgress({ step: 'Error', completed: true, error: errorMessage });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
