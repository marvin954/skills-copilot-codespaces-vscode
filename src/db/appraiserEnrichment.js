require('dotenv').config();
const { Client } = require('pg');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'parcel_research'
};

async function seedAppraiserContacts() {
  const appraiserCatalog = require('../data/appraiserCatalog');
  const client = new Client(config);
  await client.connect();

  try {
    for (const [parcelNumber, record] of Object.entries(appraiserCatalog)) {
      await client.query(
        `UPDATE properties SET
          owner_phone = $2,
          owner_email = $3,
          owner_mailing_address = $4,
          appraiser_district = $5,
          land_value = $6,
          improvement_value = $7,
          legal_description = $8,
          contact_source = $9,
          appraiser_updated_at = NOW(),
          data_source = 'county_appraiser'
         WHERE parcel_number = $1`,
        [
          parcelNumber,
          record.ownerPhone,
          record.ownerEmail,
          record.ownerMailingAddress,
          record.appraiserDistrict,
          record.landValue,
          record.improvementValue,
          record.legalDescription,
          record.contactSource
        ]
      );
    }
    console.log('Updated appraiser contact records');
  } finally {
    await client.end();
  }
}

module.exports = { seedAppraiserContacts, config };
