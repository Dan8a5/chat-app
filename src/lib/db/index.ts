import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL ?? import.meta.env.DATABASE_URL;
console.log('[db] connecting to:', connectionString ? connectionString.replace(/:([^:@]+)@/, ':***@') : 'UNDEFINED');
const ssl = connectionString?.includes('proxy.rlwy.net') ? { rejectUnauthorized: false } : false;
const pool = new Pool({ connectionString, ssl });
pool.on('error', (err) => console.error('[db] pool error:', err.message));
export const db = drizzle(pool, { schema });
