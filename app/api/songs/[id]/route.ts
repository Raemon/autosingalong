import { NextResponse } from 'next/server';
import { getSongWithVersions } from '@/lib/songsRepository';

export async function GET(_: Request, context: { params: { id: string } }) {
  try {
    const song = await getSongWithVersions(context.params.id);
    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }
    return NextResponse.json({ song });
  } catch (error) {
    console.error('Failed to load song:', error);
    return NextResponse.json({ error: 'Failed to load song' }, { status: 500 });
  }
}

