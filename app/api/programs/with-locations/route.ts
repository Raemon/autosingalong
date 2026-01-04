import { NextResponse } from 'next/server';
import { listPrograms } from '../../../../lib/programsRepository';
import { extractCityFromTitle, extractYearFromTitle, getCoordsForProgram, type ProgramWithLocation } from '../../../../lib/programLocations';

export async function GET() {
  try {
    const programs = await listPrograms();
    
    const programsWithLocations: ProgramWithLocation[] = programs
      .filter(p => !p.isSubprogram) // Only top-level programs
      .reduce<ProgramWithLocation[]>((acc, p) => {
        const city = extractCityFromTitle(p.title);
        const coords = getCoordsForProgram(p.title);
        const year = extractYearFromTitle(p.title);
        
        if (city && coords) {
          acc.push({
            id: p.id,
            title: p.title,
            city,
            year,
            lat: coords.lat,
            lng: coords.lng,
            createdAt: p.createdAt,
          });
        }
        return acc;
      }, []);
    
    return NextResponse.json({ programs: programsWithLocations });
  } catch (error) {
    console.error('Failed to fetch programs with locations:', error);
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
  }
}