import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { promises as fs } from 'fs';
import path from 'path';
import JSZip from 'jszip';

export type BackupSong = {
  id: string;
  title: string;
  versions: { id: string; label: string }[];
};

export type BackupContents = {
  songs: BackupSong[];
  programCount: number;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestingUserId = searchParams.get('requestingUserId');
    const adminError = await requireAdmin(requestingUserId);
    if (adminError) return adminError;

    const filename = searchParams.get('filename');
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
    const songsMap = new Map<string, BackupSong>();
    let programCount = 0;

    // Pattern to match song folders: songs_export/{title}___{id}/
    const songFolderPattern = /^songs_export\/(.+)___([^/]+)\/$/;
    // Pattern to match version folders: songs_export/{...}/versions/{label}___{id}/
    const versionFolderPattern = /^songs_export\/[^/]+___([^/]+)\/versions\/(.+)___([^/]+)\/$/;
    // Pattern to match programs data file
    const programsDataPattern = /^songs_export\/programs\/data\.json$/;

    for (const filePath of Object.keys(zip.files)) {
      // Check for song folders
      const songMatch = filePath.match(songFolderPattern);
      if (songMatch) {
        const title = songMatch[1];
        const songId = songMatch[2];
        if (!songsMap.has(songId)) {
          songsMap.set(songId, { id: songId, title, versions: [] });
        }
        continue;
      }

      // Check for version folders
      const versionMatch = filePath.match(versionFolderPattern);
      if (versionMatch) {
        const songId = versionMatch[1];
        const label = versionMatch[2];
        const versionId = versionMatch[3];
        const song = songsMap.get(songId);
        if (song) {
          // Avoid duplicates
          if (!song.versions.some(v => v.id === versionId)) {
            song.versions.push({ id: versionId, label });
          }
        }
        continue;
      }

      // Check for programs data
      if (programsDataPattern.test(filePath)) {
        const file = zip.files[filePath];
        try {
          const content = await file.async('string');
          const programs = JSON.parse(content);
          if (Array.isArray(programs)) {
            programCount = programs.length;
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    const songs = Array.from(songsMap.values()).sort((a, b) => a.title.localeCompare(b.title));

    return NextResponse.json({ songs, programCount } as BackupContents);
  } catch (error) {
    console.error('Read backup contents failed:', error);
    return NextResponse.json({ error: 'Failed to read backup contents' }, { status: 500 });
  }
}















