import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { promises as fs } from 'fs';
import path from 'path';

export type BackupInfo = {
  filename: string;
  createdAt: string;
  size: number;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestingUserId = searchParams.get('requestingUserId');
    const adminError = await requireAdmin(requestingUserId);
    if (adminError) return adminError;

    const backupsDir = path.join(process.cwd(), 'backups');
    let files: string[] = [];
    try {
      files = await fs.readdir(backupsDir);
    } catch {
      return NextResponse.json({ backups: [] });
    }

    const backups: BackupInfo[] = [];
    for (const file of files) {
      if (!file.endsWith('.zip')) continue;
      const filePath = path.join(backupsDir, file);
      const stats = await fs.stat(filePath);
      backups.push({
        filename: file,
        createdAt: stats.mtime.toISOString(),
        size: stats.size,
      });
    }

    backups.sort((a, b) => b.filename.localeCompare(a.filename));

    return NextResponse.json({ backups });
  } catch (error) {
    console.error('List backups failed:', error);
    return NextResponse.json({ error: 'Failed to list backups' }, { status: 500 });
  }
}















