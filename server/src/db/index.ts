import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://watchtogether:watchtogether_dev@localhost:5432/watchtogether';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
