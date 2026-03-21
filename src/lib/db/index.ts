import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL ?? import.meta.env.DATABASE_URL;
// Only use SSL for external proxy connections; internal Railway network doesn't need it
const ssl = connectionString?.includes('proxy.rlwy.net') ? { rejectUnauthorized: false } : false;
const pool = new Pool({ connectionString, ssl });
export const db = drizzle(pool, { schema });
