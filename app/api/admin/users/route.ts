import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authError = await requireAdmin(searchParams.get('requestingUserId'));
    if (authError) return authError;
    const admins = await sql`SELECT id, username, created_at FROM users WHERE is_admin = true ORDER BY created_at`;
    return NextResponse.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, requestingUserId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const authError = await requireAdmin(requestingUserId);
    if (authError) return authError;

    // Make the target user an admin
    const result = await sql`UPDATE users SET is_admin = true WHERE id = ${userId} RETURNING id, username, created_at, is_admin`;

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error making user admin:', error);
    return NextResponse.json({ error: 'Failed to make user admin' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, requestingUserId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const authError = await requireAdmin(requestingUserId);
    if (authError) return authError;

    // Remove admin status from user
    const result = await sql`UPDATE users SET is_admin = false WHERE id = ${userId} RETURNING id, username, created_at, is_admin`;

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error removing admin:', error);
    return NextResponse.json({ error: 'Failed to remove admin' }, { status: 500 });
  }
}
