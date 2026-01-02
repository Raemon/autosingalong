import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authError = await requireAdmin(searchParams.get('requestingUserId'));
    if (authError) return authError;

    const users = await sql`
      SELECT 
        u.id, 
        u.username, 
        u.created_at, 
        u.is_admin,
        u.ever_set_username,
        (SELECT COUNT(*) FROM votes v WHERE v.user_id = u.id) as vote_count,
        (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id) as comment_count
      FROM users u
      ORDER BY u.created_at DESC
    `;
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
