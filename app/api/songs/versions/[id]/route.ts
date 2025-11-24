import { NextResponse } from 'next/server';
import { updateVersionContent } from '@/lib/songsRepository';

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { content } = body;
    
    if (content === undefined) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const updatedVersion = await updateVersionContent(context.params.id, content);
    return NextResponse.json({ version: updatedVersion });
  } catch (error) {
    console.error('Failed to update version:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack, hasDatabaseUrl: !!process.env.DATABASE_URL });
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ 
      error: 'Failed to update version',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

