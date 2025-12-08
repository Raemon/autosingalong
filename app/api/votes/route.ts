import { NextResponse } from 'next/server';
import { getVotesSummary, upsertVote } from '@/lib/votesRepository';
import { getVersionById } from '@/lib/songsRepository';

const VALID_WEIGHTS = new Set([-3, -1, 0, 1, 3]);
const VALID_TYPES = new Set(['Hate', 'Dislike', 'Eh', 'Like', 'Love']);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('versionId');

    if (!versionId) {
      return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
    }

    const summary = await getVotesSummary(versionId);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Failed to load votes:', error);
    return NextResponse.json({ error: 'Failed to load votes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { versionId, songId, name, weight, type } = body;

    if (!versionId) {
      return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
    }

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json({ error: 'name is required and must be at least 3 characters' }, { status: 400 });
    }

    if (typeof weight !== 'number' || !VALID_WEIGHTS.has(weight)) {
      return NextResponse.json({ error: 'weight is invalid' }, { status: 400 });
    }

    if (!type || typeof type !== 'string' || !VALID_TYPES.has(type)) {
      return NextResponse.json({ error: 'type is invalid' }, { status: 400 });
    }

    let resolvedSongId = songId;
    if (!resolvedSongId) {
      const version = await getVersionById(versionId);
      if (!version) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      }
      resolvedSongId = version.songId;
    }

    await upsertVote({
      versionId,
      songId: resolvedSongId,
      name: name.trim(),
      weight,
      type,
    });

    const summary = await getVotesSummary(versionId);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Failed to save vote:', error);
    return NextResponse.json({ error: 'Failed to save vote' }, { status: 500 });
  }
}


