import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { versionIds, username } = body;

    if (!versionIds || !Array.isArray(versionIds) || versionIds.length === 0) {
      return NextResponse.json({ error: 'versionIds array is required' }, { status: 400 });
    }

    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 });
    }

    const result = await sql`
      SELECT c.id, c.version_id, c.content, c.created_by, c.created_at, sv.label as version_label
      FROM comments c
      JOIN song_versions sv ON c.version_id = sv.id
      WHERE c.version_id = ANY(${versionIds}) AND c.created_by = ${username} AND sv.archived = false
      ORDER BY c.created_at DESC
    `;

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching batch comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}
