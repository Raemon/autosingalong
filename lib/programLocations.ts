// Static mapping of city names to coordinates
// Used for placing programs on the globe

export type CityCoordinates = { lat: number; lng: number };

export const CITY_COORDINATES: Record<string, CityCoordinates> = {
  'NYC': { lat: 40.7128, lng: -74.0060 },
  'Washington DC': { lat: 38.9072, lng: -77.0369 },
  'Small DC': { lat: 38.9072, lng: -77.0369 },
  'Boston': { lat: 42.3601, lng: -71.0589 },
  'Seattle': { lat: 47.6062, lng: -122.3321 },
  'Portland': { lat: 45.5152, lng: -122.6784 },
  'Bay': { lat: 37.8716, lng: -122.2727 }, // Berkeley
  'Austin': { lat: 30.2672, lng: -97.7431 },
  'Frankfurt': { lat: 50.1109, lng: 8.6821 },
  'Montreal': { lat: 45.5017, lng: -73.5673 },
  'Miami': { lat: 25.7617, lng: -80.1918 },
  'North America': { lat: 39.8283, lng: -98.5795 }, // Center of US for virtual events
};

// Extract city name from program title
// Matches patterns like "NYC 2024" or "Washington DC 2023 - subtitle" or "Bay Winter Solstice 2025"
export function extractCityFromTitle(title: string): string | null {
  // Check if any city name appears in the title (case-insensitive)
  // Verify there's a year in the title
  if (!/\b(20\d{2})\b/.test(title)) return null;
  
  for (const cityName of Object.keys(CITY_COORDINATES)) {
    if (title.toLowerCase().includes(cityName.toLowerCase())) {
      return cityName;
    }
  }
  
  return null;
}

// Get coordinates for a program title
export function getCoordsForProgram(title: string): CityCoordinates | null {
  const city = extractCityFromTitle(title);
  if (!city) return null;
  return CITY_COORDINATES[city] || null;
}

// Extract year from program title
export function extractYearFromTitle(title: string): number | null {
  const match = title.match(/\b(20\d{2})\b/);
  return match ? parseInt(match[1], 10) : null;
}

export type ProgramWithLocation = {
  id: string;
  title: string;
  city: string;
  year: number | null;
  lat: number;
  lng: number;
  createdAt?: string;
};

// Group programs by location
export function groupProgramsByLocation(programs: ProgramWithLocation[]): Map<string, ProgramWithLocation[]> {
  const grouped = new Map<string, ProgramWithLocation[]>();
  for (const program of programs) {
    const key = `${program.lat},${program.lng}`;
    const existing = grouped.get(key) || [];
    existing.push(program);
    grouped.set(key, existing);
  }
  // Sort each group by year descending
  for (const [key, progs] of grouped) {
    progs.sort((a, b) => (b.year || 0) - (a.year || 0));
    grouped.set(key, progs);
  }
  return grouped;
}