import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const query = async <T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> => {
  const { default: sql } = await import('../lib/db');
  const result = await sql(strings, ...values);
  return result as T[];
};

const run = async () => {
  const users = await query<{ id: string; username: string | null; created_at: Date; is_admin: boolean }>`
    select id, username, created_at, is_admin from users order by created_at
  `;
  console.log(`Found ${users.length} users:\n`);
  users.forEach((user, index) => {
    console.log(`${index + 1}. ID: ${user.id}`);
    console.log(`   Username: ${user.username || '(no username)'}`);
    console.log(`   Admin: ${user.is_admin}`);
    console.log('');
  });
};

run().catch((error) => {
  console.error('Failed to list users:', error);
  process.exit(1);
});
