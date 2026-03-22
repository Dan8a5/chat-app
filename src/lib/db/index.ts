import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

const pool = new Pool({ connectionString: import.meta.env.DATABASE_URL ?? process.env.DATABASE_URL });
pool.on('error', (err) => console.error('[db] pool error:', err.message));
export const db = drizzle(pool, { schema });
