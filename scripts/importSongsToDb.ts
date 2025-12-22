import path from 'path';
import dotenv from 'dotenv';
import { importFromDirectories, ProgramImportResult } from '../lib/importUtils';
import { downloadSecularSolsticeRepo } from '../lib/githubDownloader';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const run = async () => {
  console.log('Starting import...');
  console.log('Downloading SecularSolstice repo from GitHub...');

  const repo = await downloadSecularSolsticeRepo();
  console.log('Downloaded to:', repo.basePath);

  const config = {
    songsDirs: [{ path: repo.songsDir, tags: ['song'] }],
    speechesDirs: [repo.speechesDir],
    programsDirs: [repo.listsDir],
    activitiesConfig: { listFile: repo.activitiesListFile, speechesDir: repo.speechesDir },
  };

  const { songResults, speechResults, activityResults, programResults, resyncResults } = await importFromDirectories(
    config,
    false, // not a dry run
    (type, result) => {
      const statusIcon = result.status === 'created' || result.status === 'created-binary' || result.status === 'resynced' ? '✓'
        : result.status === 'exists' ? '='
        : result.status === 'failed' ? '✗'
        : '?';
      if (type === 'program' || type === 'resync') {
        // @ts-ignore - ProgramImportResult is compatible
        const pr = result as ProgramImportResult;
        const extra = pr.missingElements?.length ? ` (missing: ${pr.missingElements.join(', ')})` : '';
        console.log(`  ${statusIcon} [${type}] ${pr.title} - ${pr.status}${pr.elementCount ? ` (${pr.elementCount} elements)` : ''}${extra}${pr.error ? ` (${pr.error})` : ''}`);
      } else {
        console.log(`  ${statusIcon} [${type}] ${result.title} / ${'label' in result ? result.label : ''} - ${result.status}${result.error ? ` (${result.error})` : ''}`);
      }
    }
  );

  console.log('\n=== Import Summary ===');
  console.log(`Songs: ${songResults.length} files processed`);
  console.log(`  Created: ${songResults.filter(r => r.status === 'created' || r.status === 'created-binary').length}`);
  console.log(`  Existed: ${songResults.filter(r => r.status === 'exists').length}`);
  console.log(`  Failed: ${songResults.filter(r => r.status === 'failed').length}`);
  console.log(`Speeches: ${speechResults.length} files processed`);
  console.log(`  Created: ${speechResults.filter(r => r.status === 'created').length}`);
  console.log(`  Existed: ${speechResults.filter(r => r.status === 'exists').length}`);
  console.log(`  Failed: ${speechResults.filter(r => r.status === 'failed').length}`);
  console.log(`Activities: ${activityResults.length} files processed`);
  console.log(`  Created: ${activityResults.filter(r => r.status === 'created').length}`);
  console.log(`  Existed: ${activityResults.filter(r => r.status === 'exists').length}`);
  console.log(`  Failed: ${activityResults.filter(r => r.status === 'failed').length}`);
  console.log(`Programs: ${programResults.length} files processed`);
  console.log(`  Created: ${programResults.filter(r => r.status === 'created').length}`);
  console.log(`  Existed: ${programResults.filter(r => r.status === 'exists').length}`);
  console.log(`  Failed: ${programResults.filter(r => r.status === 'failed').length}`);
  console.log(`Resynced: ${resyncResults.length} programs`);
  console.log(`  Resynced: ${resyncResults.filter(r => r.status === 'resynced').length}`);
  console.log(`  Failed: ${resyncResults.filter(r => r.status === 'failed').length}`);

  console.log('\nCleaning up temporary files...');
  await repo.cleanup();
  console.log('Done!');
};

run().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});