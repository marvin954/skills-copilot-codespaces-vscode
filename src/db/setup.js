require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'parcel_research'
};

async function setup() {
  console.log(`Connecting to PostgreSQL at ${config.host}:${config.port}`);

  const admin = new Client({ ...config, database: 'postgres' });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [config.database]);
  if (!exists.rowCount) {
    await admin.query(`CREATE DATABASE ${config.database}`);
    console.log(`Created database ${config.database}`);
  } else {
    console.log(`Database ${config.database} already exists`);
  }
  await admin.end();

  const client = new Client(config);
  await client.connect();
  await client.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  console.log('Applied schema');
  await client.end();

  const { seed } = require('./seed');
  await seed();
  try {
    const { migrate } = require('./migrate');
    const { seedAppraiserContacts } = require('./appraiserEnrichment');
    await migrate();
    await seedAppraiserContacts();
  } catch (error) {
    console.warn('Migration skipped:', error.message);
  }
  console.log('Database setup complete — restart the API server');
}

setup().catch((err) => {
  console.error('Setup failed:', err.message);
  console.error('Install PostgreSQL or run: docker compose up -d postgres');
  process.exit(1);
});
