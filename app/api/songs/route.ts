import { NextResponse } from 'next/server';
import { findVersionBySongTitleAndLabel, listSongsWithVersions } from '@/lib/songsRepository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const songTitle = searchParams.get('song');
    const fileLabel = searchParams.get('file');

    if (songTitle && fileLabel) {
      const version = await findVersionBySongTitleAndLabel(songTitle, fileLabel);
      if (!version) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      if (version.audioUrl) {
        return NextResponse.json({ audioUrl: version.audioUrl });
      }
      if (!version.content) {
        return NextResponse.json({ error: 'No content available' }, { status: 404 });
      }
      return NextResponse.json({ content: version.content });
    }

    const songs = await listSongsWithVersions();
    return NextResponse.json({ songs });
  } catch (error) {
    console.error('Failed to load songs from database:', error);
    return NextResponse.json({ error: 'Failed to load songs' }, { status: 500 });
  }
}

