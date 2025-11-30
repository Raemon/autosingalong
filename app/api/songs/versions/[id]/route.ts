import { NextResponse } from 'next/server';
import { getVersionById, getPreviousVersionsChain } from '@/lib/songsRepository';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const version = await getVersionById(id);
    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }
    const previousVersions = await getPreviousVersionsChain(id);
    return NextResponse.json({ version, previousVersions });
  } catch (error) {
    console.error('Failed to load version:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      error: 'Failed to load version',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}
