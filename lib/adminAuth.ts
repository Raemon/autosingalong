import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function requireAdmin(requestingUserId: string | null): Promise<NextResponse | null> {
  if (!requestingUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await sql`SELECT is_admin FROM users WHERE id = ${requestingUserId}`;
  if (user.length === 0 || !user[0].is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  return null;
}


