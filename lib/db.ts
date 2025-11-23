import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

declare global {
  // eslint-disable-next-line no-var
  var __neonSql__: NeonQueryFunction<false, false> | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const sql = (globalThis.__neonSql__ ?? neon(connectionString)) as NeonQueryFunction<false, false>;

if (process.env.NODE_ENV !== 'production') {
  globalThis.__neonSql__ = sql;
}

export default sql;

