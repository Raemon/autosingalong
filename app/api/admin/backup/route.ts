import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { listSongsWithAllVersions } from '@/lib/songsRepository';
import { generateSongsExportBuffer } from '@/lib/exportUtils';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const isValidBackupSecret = (request: NextRequest): boolean => {
  const authHeader = request.headers.get('authorization');
  const backupSecret = process.env.BACKUP_SECRET;
  if (!backupSecret || !authHeader) return false;
  const expected = Buffer.from(`Bearer ${backupSecret}`);
  const received = Buffer.from(authHeader);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
};

export async function POST(request: NextRequest) {
  try {
    // Check for backup secret (for GitHub Actions) or admin auth
    const hasValidSecret = isValidBackupSecret(request);
    if (!hasValidSecret) {
      const { searchParams } = new URL(request.url);
      const requestingUserId = searchParams.get('requestingUserId');
      const adminError = await requireAdmin(requestingUserId);
      if (adminError) return adminError;
    }

    const songs = await listSongsWithAllVersions();
    if (!songs.length) {
      return NextResponse.json({ error: 'No songs available to backup' }, { status: 400 });
    }

    const buffer = await generateSongsExportBuffer(songs);
    const date = new Date().toISOString().split('T')[0];
    const filename = `songs-export-${date}.zip`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Backup-Filename': filename,
        'X-Songs-Count': String(songs.length),
        'X-Versions-Count': String(songs.reduce((acc, s) => acc + s.versions.length, 0)),
      },
    });
  } catch (error) {
    console.error('Backup failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Backup failed', details: process.env.NODE_ENV === 'development' ? errorMessage : undefined },
      { status: 500 },
    );
  }
}