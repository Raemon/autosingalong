import { NextResponse } from 'next/server';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '';
  const dbId = dbUrl.split('@').pop();
  return  NextResponse.json({ dbId: dbId?.split('.')[0] });

}
