/**
 * Database configuration
 */
const pg = require('pg');
const runtime = require('./runtime');

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'parcel_research',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  connectionTimeoutMillis: 3000
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

async function initDatabase() {
  if (process.env.USE_MEMORY_AUTH === 'true') {
    runtime.useMemoryAuth = true;
    runtime.useMemoryData = true;
    console.warn('⚠ Using in-memory auth store (USE_MEMORY_AUTH=true)');
    return;
  }

  try {
    await pool.query('SELECT 1');
    console.log('✓ Connected to PostgreSQL');
  } catch (error) {
    runtime.useMemoryAuth = true;
    runtime.useMemoryData = true;
    console.warn('⚠ PostgreSQL unavailable — using in-memory auth store for local development');
    console.warn('  Start PostgreSQL and run src/db/schema.sql for full functionality');
  }
}

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Executed query in ${duration}ms: ${text.substring(0, 100)}`);
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  initDatabase
};
