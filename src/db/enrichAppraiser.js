require('dotenv').config();
const { migrate } = require('./migrate');
const { seedAppraiserContacts } = require('./appraiserEnrichment');

async function run() {
  await migrate();
  await seedAppraiserContacts();
  console.log('Appraiser migration complete');
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
