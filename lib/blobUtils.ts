import sql from '@/lib/db';

export const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);

export const getSongBlobPrefix = async (songId: string | null): Promise<string> => {
  if (!songId) return 'song-unknown';
  const songs = await sql`SELECT title FROM songs WHERE id = ${songId}::uuid`;
  const title = songs[0]?.title;
  return title ? `${slugify(title)}-${songId}` : `song-${songId}`;
};

export const getProgramBlobPrefix = async (programId: string): Promise<string> => {
  const programs = await sql`SELECT title FROM programs WHERE id = ${programId}::uuid`;
  const title = programs[0]?.title;
  return title ? `${slugify(title)}-${programId}` : `program-${programId}`;
};
