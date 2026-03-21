import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL ?? import.meta.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('railway') ? { rejectUnauthorized: false } : false,
});
export const db = drizzle(pool, { schema });
