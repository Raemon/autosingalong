import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { promises as fs } from 'fs';
import path from 'path';
import JSZip from 'jszip';
import sql from '@/lib/db';

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
  try {
    const { searchParams } = new URL(request.url);
    const requestingUserId = searchParams.get('requestingUserId');
    const adminError = await requireAdmin(requestingUserId);
    if (adminError) return adminError;

    const body = await request.json();
    const { filename } = body;
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Sanitize filename to prevent path traversal
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

    const zip = await JSZip.loadAsync(zipBuffer);

    // Parse the backup structure
    const songs: { id: string; title: string; tags: string[]; createdBy: string | null; createdAt: string }[] = [];
    const versions: SongVersionData[] = [];
    const programs: ProgramData[] = [];

    // Find all song folders and their version data.json files
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

    // Extract song info from folder structure
    for (const folderPath of songFolders) {
      const match = folderPath.match(/^songs_export\/(.+)___([^/]+)\/$/);
      if (match) {
        const title = match[1];
        const songId = match[2];
        songs.push({
          id: songId,
          title,
          tags: ['song'],
          createdBy: null,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Extract version data
    for (const [filePath, file] of Object.entries(zip.files)) {
      const versionMatch = filePath.match(versionDataPattern);
      if (versionMatch) {
        const content = await file.async('string');
        try {
          const versionData = JSON.parse(content) as SongVersionData;
          versions.push(versionData);
          // Update song info from version data if available
          const song = songs.find(s => s.id === versionData.songId);
          if (song && versionData.createdAt) {
            // Use the earliest version createdAt as song createdAt
            if (new Date(versionData.createdAt) < new Date(song.createdAt)) {
              song.createdAt = versionData.createdAt;
            }
          }
        } catch (e) {
          console.warn(`Failed to parse version data at ${filePath}:`, e);
        }
      }

      // Extract programs data
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

    // Begin restoration - delete existing data and insert from backup
    // Order matters due to foreign key constraints

    // 1. Delete in reverse dependency order
    await sql`DELETE FROM votes WHERE 1=1`;
    await sql`DELETE FROM comments WHERE 1=1`;
    await sql`DELETE FROM song_versions WHERE 1=1`;
    await sql`DELETE FROM songs WHERE 1=1`;
    await sql`DELETE FROM programs WHERE 1=1`;

    // 2. Insert songs first (versions reference songs)
    for (const song of songs) {
      await sql`
        INSERT INTO songs (id, title, tags, created_by, created_at, archived)
        VALUES (${song.id}, ${song.title}, ${song.tags}::text[], ${song.createdBy}, ${song.createdAt}, false)
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, tags = EXCLUDED.tags
      `;
    }

    // 3. Insert versions (without foreign key references first)
    for (const version of versions) {
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

    // 4. Update version references now that all versions exist
    for (const version of versions) {
      if (version.previousVersionId || version.nextVersionId || version.originalVersionId) {
        await sql`
          UPDATE song_versions SET
            previous_version_id = ${version.previousVersionId},
            next_version_id = ${version.nextVersionId},
            original_version_id = ${version.originalVersionId}
          WHERE id = ${version.id}
        `;
      }
    }

    // 5. Insert programs
    for (const program of programs) {
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

    return NextResponse.json({
      success: true,
      restored: {
        songs: songs.length,
        versions: versions.length,
        programs: programs.length,
      },
    });
  } catch (error) {
    console.error('Restore backup failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Restore failed', details: process.env.NODE_ENV === 'development' ? errorMessage : undefined },
      { status: 500 },
    );
  }
}














