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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack, hasDatabaseUrl: !!process.env.DATABASE_URL });
    return NextResponse.json({ 
      error: 'Failed to load song',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

