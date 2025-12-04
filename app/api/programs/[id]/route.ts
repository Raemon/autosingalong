import { NextRequest, NextResponse } from 'next/server';
import { getProgramById, updateProgramElementIds } from '../../../../lib/programsRepository';

export async function GET(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id} = await params;
    const program = await getProgramById(id);
    if (!program) {
      return NextResponse.json({error: 'Program not found'}, {status: 404});
    }
    return NextResponse.json({program});
  } catch (error) {
    console.error('Failed to load program:', error);
    return NextResponse.json({error: 'Failed to load program'}, {status: 500});
  }
}

export async function PATCH(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  try {
    const {id} = await params;
    const body = await request.json();
    const {elementIds, programIds} = body;
    if (!Array.isArray(elementIds) || !Array.isArray(programIds)) {
      return NextResponse.json({error: 'elementIds and programIds must be arrays'}, {status: 400});
    }
    const program = await updateProgramElementIds(id, elementIds, programIds);
    return NextResponse.json({program});
  } catch (error) {
    console.error('Failed to update program:', error);
    return NextResponse.json({error: 'Failed to update program'}, {status: 500});
  }
}
