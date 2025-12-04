import { NextResponse } from 'next/server';
import { listVersionsForChangelog } from '@/lib/songsRepository';

export async function GET() {
  try {
    const versions = await listVersionsForChangelog();
    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error fetching changelog:', error);
    return NextResponse.json({ error: 'Failed to fetch changelog' }, { status: 500 });
  }
}
