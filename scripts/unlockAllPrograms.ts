import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const query = async <T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> => {
  const { default: sql } = await import('../lib/db');
  const result = await sql(strings, ...values);
  return result as T[];
};

type LockedProgram = { id: string; title: string };

const run = async () => {
  // Get all locked programs from latest versions
  const lockedPrograms = await query<LockedProgram>`
    WITH latest_versions AS (
      SELECT DISTINCT ON (program_id) *
      FROM program_versions
      ORDER BY program_id, created_at DESC
    )
    SELECT p.id, lv.title FROM programs p
    JOIN latest_versions lv ON lv.program_id = p.id
    WHERE lv.locked = true AND lv.archived = false
  `;
  console.log(`Found ${lockedPrograms.length} locked programs`);

  if (lockedPrograms.length === 0) {
    console.log('No locked programs to unlock.');
    return;
  }

  // Unlock each program by creating a new version with locked = false
  let unlockedCount = 0;
  for (const program of lockedPrograms) {
    try {
      await query`
        WITH latest_versions AS (
          SELECT DISTINCT ON (program_id) *
          FROM program_versions
          ORDER BY program_id, created_at DESC
        )
        INSERT INTO program_versions (program_id, title, element_ids, program_ids, archived, is_subprogram, video_url, print_program_foreword, print_program_epitaph, locked, created_by)
        SELECT lv.program_id, lv.title, lv.element_ids, lv.program_ids, lv.archived, lv.is_subprogram, lv.video_url, lv.print_program_foreword, lv.print_program_epitaph, false, 'unlock-script'
        FROM programs p
        JOIN latest_versions lv ON lv.program_id = p.id
        WHERE p.id = ${program.id}
      `;
      console.log(`  ✓ Unlocked: ${program.title}`);
      unlockedCount++;
    } catch (error) {
      console.error(`  ✗ Failed to unlock ${program.title}:`, error);
    }
  }

  console.log(`\nUnlocked ${unlockedCount} of ${lockedPrograms.length} programs.`);
};

run().catch((error) => {
  console.error('Failed to unlock programs:', error);
  process.exit(1);
});