import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const REPO_ZIP_URL = 'https://github.com/SecularSolstice/SecularSolstice.github.io/archive/refs/heads/master.zip';
const EXTRACTED_FOLDER_NAME = 'SecularSolstice.github.io-master';

export type DownloadedRepo = {
  basePath: string;
  songsDir: string;
  speechesDir: string;
  listsDir: string;
  activitiesListFile: string; // lists/All_Activities.list - defines which speeches are activities
  cleanup: () => Promise<void>;
};

export const downloadSecularSolsticeRepo = async (): Promise<DownloadedRepo> => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'secular-solstice-'));
  const zipPath = path.join(tempDir, 'repo.zip');

  try {
    // Download the ZIP
    const response = await fetch(REPO_ZIP_URL);
    if (!response.ok) {
      throw new Error(`Failed to download repo: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(zipPath, Buffer.from(arrayBuffer));

    // Extract the ZIP using unzip command (available on most systems including Vercel)
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    await execAsync(`unzip -q "${zipPath}" -d "${tempDir}"`);

    // Remove the ZIP file to save space
    await fs.unlink(zipPath);

    const basePath = path.join(tempDir, EXTRACTED_FOLDER_NAME);

    // Verify the extraction worked
    try {
      await fs.access(basePath);
    } catch {
      throw new Error(`Extraction failed - expected folder not found: ${basePath}`);
    }

    return {
      basePath,
      songsDir: path.join(basePath, 'songs'),
      speechesDir: path.join(basePath, 'speeches'),
      listsDir: path.join(basePath, 'lists'),
      activitiesListFile: path.join(basePath, 'lists', 'All_Activities.list'),
      cleanup: async () => {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (err) {
          console.warn('Failed to cleanup temp directory:', err);
        }
      },
    };
  } catch (error) {
    // Cleanup on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
    throw error;
  }
};

