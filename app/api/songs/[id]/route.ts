import { NextResponse } from 'next/server';
import { getSongWithVersions, updateSongTags } from '@/lib/songsRepository';

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const song = await getSongWithVersions(params.id);
    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }
    return NextResponse.json({ song });
  } catch (error) {
    console.error('Failed to load song:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack, hasDatabaseUrl: !!process.env.DATABASE_URL });
    return NextResponse.json({ 
      error: 'Failed to load song',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { tags } = body;
    
    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'tags must be an array' }, { status: 400 });
    }
    
    const updatedSong = await updateSongTags(params.id, tags);
    return NextResponse.json({ song: updatedSong });
  } catch (error) {
    console.error('Failed to update song tags:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      error: 'Failed to update song tags',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

