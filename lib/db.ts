import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

declare global {
  // eslint-disable-next-line no-var
  var __neonSql__: NeonQueryFunction<false, false> | undefined;
}

const getConnectionString = (): string => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    const envKeys = Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('DB')).join(', ');
    console.error('DATABASE_URL is not set. Available env vars:', envKeys || 'none');
    throw new Error(`DATABASE_URL is not set. Environment: ${process.env.NODE_ENV || 'unknown'}. Available DB-related vars: ${envKeys || 'none'}`);
  }
  return connectionString;
};

const connectionString = getConnectionString();

const sql = (globalThis.__neonSql__ ?? neon(connectionString)) as NeonQueryFunction<false, false>;

if (process.env.NODE_ENV !== 'production') {
  globalThis.__neonSql__ = sql;
}

export default sql;

