import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

const pool = new Pool({
  connectionString: import.meta.env.DATABASE_URL,
  ssl: import.meta.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false,
});
export const db = drizzle(pool, { schema });
