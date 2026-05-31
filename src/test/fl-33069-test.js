require('dotenv').config();
const { lookupByAddress } = require('../services/FlArcGisParcelProvider');

const tests = [
  { address: '4400 W Sample Rd', city: 'Coconut Creek', state: 'FL', zipCode: '33069' },
  { address: '4400 W Sample Rd', city: 'Pompano Beach', state: 'FL', zipCode: '33069' },
  { address: '1000 NW 31st Ave', city: 'Pompano Beach', state: 'FL', zipCode: '33069' }
];

async function main() {
  for (const input of tests) {
    const start = Date.now();
    console.log(`\n=== ${input.address}, ${input.city} ${input.zipCode} ===`);
    const result = await lookupByAddress(input);
    console.log(result ? `FOUND ${Date.now() - start}ms` : `NO RESULT ${Date.now() - start}ms`);
    if (result) {
      console.log(result.property.address, '|', result.property.city, '|', result.property.zip_code, '|', result.property.owner_name);
    }
  }
}

main().catch(console.error);
