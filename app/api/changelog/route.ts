import { NextResponse, NextRequest } from 'next/server';
import { listVersionsForChangelog } from '@/lib/songsRepository';

export async function GET(request: NextRequest) {
  try {
    const songId = request.nextUrl.searchParams.get('songId') || undefined;
    const filename = request.nextUrl.searchParams.get('filename') || undefined;
    const versions = await listVersionsForChangelog(songId, filename);
    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error fetching changelog:', error);
    return NextResponse.json({ error: 'Failed to fetch changelog' }, { status: 500 });
  }
}
