import 'dotenv/config';
import pg from 'pg';
import { createClient } from 'redis';

const { Pool } = pg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const redisPub = createClient({ url: process.env.REDIS_URL });
export const redisSub = createClient({ url: process.env.REDIS_URL });

export async function initConnections() {
  await db.query('SELECT 1');
  console.log('✅ PostgreSQL connecté');

  await redisPub.connect();
  await redisSub.connect();
  console.log('✅ Redis (Pub/Sub) connecté');
}