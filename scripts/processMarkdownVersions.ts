/**
 * Script to process markdown versions:
 * 1. Compare first line with song title (after stripping special chars, lowercasing, trimming)
 * 2. If they match, delete the first line
 * 3. If next content line is a header starting with "by ", convert it to italics
 *
 * Usage:
 *   npx tsx scripts/processMarkdownVersions.ts
 */
import path from 'path';
import dotenv from 'dotenv';
import { normalizeString, isHeaderStartingWithBy, convertHeaderToItalics } from '../lib/markdownUtils';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const query = async <T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> => {
  const { default: sql } = await import('../lib/db');
  const result = await sql(strings, ...values);
  return result as T[];
};

const getFirstLine = (content: string | null): string | null => {
  if (!content) return null;
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return null;
};

const getNextContentLine = (content: string | null, afterLineIndex: number): { line: string; index: number } | null => {
  if (!content) return null;
  const lines = content.split('\n');
  for (let i = afterLineIndex + 1; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();
    if (trimmed.length > 0) {
      return { line: trimmed, index: i };
    }
  }
  return null;
};

const processContent = (content: string | null, songTitle: string): { newContent: string | null; changed: boolean } => {
  if (!content) return { newContent: content, changed: false };
  
  const lines = content.split('\n');
  let firstLineIndex = -1;
  let firstLine: string | null = null;
  
  // Find first non-empty line
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();
    if (trimmed.length > 0) {
      firstLineIndex = i;
      firstLine = trimmed;
      break;
    }
  }
  
  if (firstLineIndex === -1 || !firstLine) {
    return { newContent: content, changed: false }; // No content to process
  }
  
  // Check if first line matches song title
  const normalizedFirstLine = normalizeString(firstLine);
  const normalizedTitle = normalizeString(songTitle);
  
  let shouldDeleteFirstLine = normalizedFirstLine === normalizedTitle;
  
  let newLines = [...lines];
  let changed = false;
  
  // Delete first line if needed
  if (shouldDeleteFirstLine) {
    newLines[firstLineIndex] = '';
    changed = true;
    
    // After deletion, find next content line
    const nextLine = getNextContentLine(newLines.join('\n'), firstLineIndex);
    
    // Check if next content line is a header starting with "by "
    if (nextLine) {
      const nextLineContent = nextLine.line.trim();
      if (isHeaderStartingWithBy(nextLineContent)) {
        newLines[nextLine.index] = convertHeaderToItalics(nextLineContent);
        changed = true;
      }
    }
  }
  
  return { newContent: newLines.join('\n'), changed };
};

const run = async () => {
  console.log('Fetching all versions with .md extension...\n');
  
  const versions = await query<{ id: string; label: string; content: string | null; songTitle: string }>`
    select
      v.id,
      v.label,
      v.content,
      s.title as "songTitle"
    from song_versions v
    join songs s on v.song_id = s.id
    where v.label like '%.md'
      and v.archived = false
      and s.archived = false
      and v.content is not null
    order by s.title asc, v.label asc
  `;
  
  console.log(`Found ${versions.length} markdown versions\n`);
  console.log('='.repeat(80));
  
  let processedCount = 0;
  let updatedCount = 0;
  
  for (const version of versions) {
    const versionId = version.id;
    const label = version.label;
    const content = version.content;
    const songTitle = version.songTitle;
    
    const firstLine = getFirstLine(content);
    
    console.log(`\nVersion: ${label}`);
    console.log(`Song Title: ${songTitle}`);
    console.log(`First Line: ${firstLine || '(empty)'}`);
    
    if (!content) {
      console.log('  Skipping: No content');
      continue;
    }
    
    processedCount++;
    
    const { newContent, changed } = processContent(content, songTitle);
    
    if (changed) {
      await query`
        update song_versions
        set content = ${newContent}
        where id = ${versionId}
      `;
      updatedCount++;
      console.log('  ✓ Updated');
    } else {
      console.log('  No changes needed');
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`\nProcessed: ${processedCount} versions`);
  console.log(`Updated: ${updatedCount} versions`);
};

run().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
