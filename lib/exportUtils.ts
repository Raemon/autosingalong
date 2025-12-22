import JSZip from 'jszip';
import type { SongWithVersions } from '@/lib/songsRepository';

export const sanitizeFileName = (name: string) => {
  const cleaned = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
  const collapsedSpaces = cleaned.replace(/\s+/g, ' ');
  return collapsedSpaces || 'untitled';
};

const buildExportZip = (songs: SongWithVersions[]): JSZip => {
  const zip = new JSZip();
  const rootFolder = zip.folder('songs_export');
  if (!rootFolder) {
    throw new Error('Could not initialize download archive');
  }

  songs.forEach((song) => {
    const songFolderName = `${sanitizeFileName(song.title || 'song')}_${song.id}`;
    const songFolder = rootFolder.folder(songFolderName);
    if (!songFolder) return;

    const versionsFolder = songFolder.folder('versions');
    if (!versionsFolder) return;

    song.versions.forEach((version) => {
      const versionFolderName = `${sanitizeFileName(version.label)}_${version.id}`;
      const versionFolder = versionsFolder.folder(versionFolderName);
      if (!versionFolder) return;

      const contentText = version.content ?? '';
      versionFolder.file('content.txt', contentText || 'No stored content for this version.');
      versionFolder.file('data.json', JSON.stringify(version, null, 2));
    });
  });

  return zip;
};

export const generateSongsExportZip = async (songs: SongWithVersions[]): Promise<Blob> => {
  return buildExportZip(songs).generateAsync({ type: 'blob' });
};

export const generateSongsExportBuffer = async (songs: SongWithVersions[]): Promise<Buffer> => {
  return buildExportZip(songs).generateAsync({ type: 'nodebuffer' });
};
