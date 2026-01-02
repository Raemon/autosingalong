/**
 * Debug script to check file modification timestamps from downloaded GitHub repo.
 *
 * Usage:
 *   npx tsx scripts/checkFileTimestamps.ts [path-to-file-or-dir]
 *
 * If no path is provided, uses the default cache dir (.secular-solstice-cache).
 * If the cache doesn't exist, prompts you to run the download first.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DEFAULT_DOWNLOAD_DIR } from '../lib/githubDownloader';

const execAsync = promisify(exec);
const CLONED_FOLDER_NAME = 'SecularSolstice.github.io';

const formatDate = (date: Date): string => {
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
};

const getGitCommitDate = async (repoPath: string, filePath: string): Promise<string | null> => {
  try {
    const relativePath = path.relative(repoPath, filePath);
    const { stdout } = await execAsync(
      `git log -1 --format="%aI" -- "${relativePath}"`,
      { cwd: repoPath }
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
};

const checkFile = async (filePath: string, repoPath?: string) => {
  const stats = await fs.stat(filePath);
  console.log(`File: ${filePath}`);
  console.log(`  mtime (modification): ${formatDate(stats.mtime)}`);
  if (repoPath) {
    const gitDate = await getGitCommitDate(repoPath, filePath);
    console.log(`  git commit date:      ${gitDate || '(not in git history)'}`);
  }
  return stats;
};

const checkDirectory = async (dirPath: string, repoPath: string | undefined, maxFiles = 10) => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    if (count >= maxFiles) {
      console.log(`\n... and ${entries.length - maxFiles} more files/dirs`);
      break;
    }
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isFile()) {
      await checkFile(fullPath, repoPath);
      console.log();
      count++;
    } else if (entry.isDirectory()) {
      console.log(`Directory: ${fullPath}/`);
      count++;
    }
  }
};

const run = async () => {
  const args = process.argv.slice(2);
  let targetPath = args[0];

  if (!targetPath) {
    // Use default cache dir
    targetPath = path.join(DEFAULT_DOWNLOAD_DIR, CLONED_FOLDER_NAME);
    console.log(`Using default cache path: ${targetPath}\n`);
  }

  // Determine if we're in a git repo for git log queries
  let repoPath: string | undefined;
  try {
    await fs.access(path.join(targetPath, '.git'));
    repoPath = targetPath;
    console.log('Git repository detected - will show git commit dates.\n');
  } catch {
    // Check parent dirs
    let checkPath = targetPath;
    while (checkPath !== path.dirname(checkPath)) {
      try {
        await fs.access(path.join(checkPath, '.git'));
        repoPath = checkPath;
        console.log(`Git repository detected at: ${repoPath}\n`);
        break;
      } catch {
        checkPath = path.dirname(checkPath);
      }
    }
  }

  try {
    const stats = await fs.stat(targetPath);

    if (stats.isFile()) {
      await checkFile(targetPath, repoPath);
    } else if (stats.isDirectory()) {
      console.log(`Checking timestamps in: ${targetPath}\n`);
      console.log('='.repeat(60));

      // Check lists directory specifically (for programs)
      const listsDir = path.join(targetPath, 'lists');
      try {
        await fs.access(listsDir);
        console.log('\n--- Lists (Programs) Directory ---\n');
        await checkDirectory(listsDir, repoPath, 5);
      } catch {
        // lists dir doesn't exist in this path
      }

      // Check songs directory
      const songsDir = path.join(targetPath, 'songs');
      try {
        await fs.access(songsDir);
        console.log('\n--- Songs Directory (first 5 subdirs) ---\n');
        const songEntries = await fs.readdir(songsDir, { withFileTypes: true });
        for (const entry of songEntries.filter(e => e.isDirectory()).slice(0, 5)) {
          const songPath = path.join(songsDir, entry.name);
          const readmeFile = path.join(songPath, 'README.md');
          try {
            await checkFile(readmeFile, repoPath);
            console.log();
          } catch {
            console.log(`Song: ${entry.name} (no README.md)`);
            // Check any file in the dir
            const files = await fs.readdir(songPath);
            if (files.length > 0) {
              await checkFile(path.join(songPath, files[0]), repoPath);
              console.log();
            }
          }
        }
      } catch {
        // songs dir doesn't exist
      }

      // Just check whatever is at the target
      if (!targetPath.includes('lists') && !targetPath.includes('songs')) {
        await checkDirectory(targetPath, repoPath, 10);
      }
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`Path not found: ${targetPath}`);
      console.error('\nIf you want to use the cached download, run first:');
      console.error('  npx tsx scripts/importSongsToDb.ts --download-only');
    } else {
      throw err;
    }
    process.exit(1);
  }
};

run().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
