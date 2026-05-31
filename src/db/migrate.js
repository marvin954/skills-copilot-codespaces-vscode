/**
 * Add owner contact and appraiser fields to properties
 */
require('dotenv').config();
const { Client } = require('pg');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'parcel_research'
};

const ALTER_STATEMENTS = [
  'ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(50)',
  'ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255)',
  'ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_mailing_address VARCHAR(255)',
  'ALTER TABLE properties ADD COLUMN IF NOT EXISTS appraiser_district VARCHAR(150)',
  'ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_value NUMERIC(12, 2)',
  'ALTER TABLE properties ADD COLUMN IF NOT EXISTS improvement_value NUMERIC(12, 2)',
  'ALTER TABLE properties ADD COLUMN IF NOT EXISTS legal_description TEXT',
  'ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_source VARCHAR(100)',
  'ALTER TABLE properties ADD COLUMN IF NOT EXISTS appraiser_updated_at TIMESTAMPTZ'
];

async function migrate() {
  const client = new Client(config);
  await client.connect();

  try {
    for (const statement of ALTER_STATEMENTS) {
      await client.query(statement);
    }
    console.log('Applied appraiser/contact migrations');
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}

module.exports = { migrate };
