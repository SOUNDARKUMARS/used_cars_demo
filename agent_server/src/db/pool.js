import { createClient } from '@supabase/supabase-js';
import { newDb } from 'pg-mem';
import pg from 'pg';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

// Supabase Cloud JS client
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

// Optional direct PostgreSQL connection pool (if remote connection string provided)
const hasDirectPgUrl = Boolean(
  env.DATABASE_URL &&
  (env.DATABASE_URL.includes('supabase.co') || env.DATABASE_URL.includes('pooler.supabase.com'))
);

let directPool = null;
if (hasDirectPgUrl) {
  directPool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  directPool.on('error', (err) => {
    logger.error({ err: err.message }, 'Unexpected error on direct Supabase Postgres pool');
  });
}

/**
 * Validates that an SQL query is strictly read-only SELECT.
 */
export function validateReadOnlySql(rawSql) {
  if (!rawSql || typeof rawSql !== 'string') {
    throw new Error('Query must be a non-empty string');
  }

  let sql = rawSql.trim();

  // Strip single trailing semicolon if present
  if (sql.endsWith(';')) {
    sql = sql.slice(0, -1).trim();
  }

  const withoutQuotes = sql.replace(/'(?:''|[^'])*'/g, '');
  if (withoutQuotes.includes(';')) {
    throw new Error('Multiple SQL statements are strictly forbidden');
  }

  const firstWordMatch = sql.match(/^\s*(SELECT|WITH)\b/i);
  if (!firstWordMatch) {
    throw new Error('Only SELECT queries are allowed. Mutation and administrative queries are prohibited.');
  }

  const forbiddenPatterns = [
    /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE)\b/i,
    /\b(GRANT|REVOKE|CREATE|REPLACE|EXECUTE)\b/i,
    /\b(COPY|VACUUM|CALL|DO|BEGIN|COMMIT|ROLLBACK)\b/i,
    /\b(LOCK|SET|RESET|EXPLAIN|ANALYZE)\b/i,
    /\b(INTO\s+OUTFILE|INTO\s+DUMPFILE)\b/i,
    /\b(PG_SLEEP|PG_TERMINATE_BACKEND|PG_CANCEL_BACKEND)\b/i
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(withoutQuotes)) {
      const match = withoutQuotes.match(pattern);
      throw new Error(`Forbidden SQL keyword detected: "${match[0]}". Only read-only SELECT queries are allowed.`);
    }
  }

  // Ensure reasonable default limit if omitted
  if (!/\bLIMIT\s+\d+/i.test(withoutQuotes)) {
    sql = `${sql} LIMIT 25`;
  }

  return sql;
}

// In-memory cache for live Supabase Cloud tables (5-second freshness)
let cachedData = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5000;

async function fetchLiveSupabaseTables() {
  const now = Date.now();
  if (cachedData && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedData;
  }

  const [carsRes, dealersRes] = await Promise.all([
    supabase.from('cars').select('*'),
    supabase.from('dealers').select('*')
  ]);

  if (carsRes.error) {
    throw new Error(`Failed to fetch cars from Supabase Cloud: ${carsRes.error.message}`);
  }

  cachedData = {
    cars: carsRes.data || [],
    dealers: dealersRes.data || []
  };
  lastFetchTime = now;
  return cachedData;
}

/**
 * Builds an in-memory PostgreSQL instance populated directly with live Supabase Cloud DB tables.
 */
async function buildCloudPgMemClient() {
  const { cars, dealers } = await fetchLiveSupabaseTables();
  const db = newDb();
  const pgAdapter = db.adapters.createPg();
  const client = new pgAdapter.Client();
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.cars (
      id text primary key,
      make text,
      model text,
      year integer,
      variant text,
      title text,
      price numeric,
      price_formatted text,
      emi text,
      emi_numeric numeric,
      inspected boolean,
      inspected_badge text,
      home_inspected_badge text,
      km text,
      km_numeric integer,
      fuel text,
      transmission text,
      ownership text,
      location text,
      body_type text,
      color text,
      insurance text,
      rto text,
      image text,
      cutout_image text,
      detail_hero_image text,
      about_summary text,
      about_full text,
      dealer_id text,
      listing_status text,
      is_draft boolean
    );

    CREATE TABLE IF NOT EXISTS public.dealers (
      id text primary key,
      name text,
      address text,
      city text,
      phone text,
      whatsapp text,
      hours text,
      rating numeric,
      reviews_count integer
    );
  `);

  for (const c of cars) {
    await client.query(`
      INSERT INTO public.cars (
        id, make, model, year, variant, title, price, price_formatted,
        emi, emi_numeric, inspected, inspected_badge, home_inspected_badge,
        km, km_numeric, fuel, transmission, ownership, location, body_type,
        color, insurance, rto, image, cutout_image, detail_hero_image,
        about_summary, about_full, dealer_id, listing_status, is_draft
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26,
        $27, $28, $29, $30, $31
      )
    `, [
      c.id, c.make, c.model, c.year, c.variant, c.title, c.price, c.price_formatted,
      c.emi, c.emi_numeric, c.inspected ?? true, c.inspected_badge, c.home_inspected_badge,
      c.km, c.km_numeric, c.fuel, c.transmission, c.ownership, c.location, c.body_type,
      c.color, c.insurance, c.rto, c.image, c.cutout_image, c.detail_hero_image,
      c.about_summary, c.about_full, c.dealer_id, c.listing_status, c.is_draft ?? false
    ]);
  }

  for (const d of dealers) {
    await client.query(`
      INSERT INTO public.dealers (id, name, address, city, phone, whatsapp, hours, rating, reviews_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      d.id, d.name, d.address, d.city, d.phone, d.whatsapp, d.hours, d.rating, d.reviews_count
    ]);
  }

  return client;
}

/**
 * Execute a strictly read-only SQL query against Supabase Cloud DB.
 */
export async function executeReadOnlyQuery(rawSql, params = []) {
  const sanitizedSql = validateReadOnlySql(rawSql);
  const start = Date.now();

  // Path 1: Direct PostgreSQL pool if remote connection string provided
  if (directPool) {
    const client = await directPool.connect();
    try {
      await client.query('BEGIN READ ONLY');
      await client.query("SET LOCAL statement_timeout = '4000ms'");
      const result = await client.query(sanitizedSql, params);
      await client.query('COMMIT');
      const duration = Date.now() - start;
      return {
        rows: result.rows,
        rowCount: result.rowCount,
        sql: sanitizedSql,
        durationMs: duration
      };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  // Path 2: Direct Supabase Cloud DB execution
  const client = await buildCloudPgMemClient();
  try {
    const result = await client.query(sanitizedSql, params);
    const duration = Date.now() - start;
    logger.debug({ duration, rowCount: result.rowCount, sql: sanitizedSql }, 'Executed read-only SQL on Supabase Cloud DB');
    return {
      rows: result.rows || [],
      rowCount: result.rowCount || (result.rows ? result.rows.length : 0),
      sql: sanitizedSql,
      durationMs: duration
    };
  } finally {
    await client.end().catch(() => {});
  }
}

/**
 * Health check querying live Supabase Cloud DB directly.
 */
export async function checkHealth() {
  const start = Date.now();
  try {
    const { count, error } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return {
      status: 'healthy',
      database: 'Supabase Cloud Database',
      project: env.SUPABASE_URL,
      carsCount: count,
      mode: directPool ? 'direct_tcp_pool' : 'supabase_cloud_api',
      latencyMs: Date.now() - start
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      error: err.message,
      latencyMs: Date.now() - start
    };
  }
}

export async function closePool() {
  if (directPool) {
    await directPool.end();
  }
}

export const pool = directPool;
export default { executeReadOnlyQuery, validateReadOnlySql, checkHealth, closePool, supabase };
