const PropertyAppraiserService = require('../services/PropertyAppraiserService');
const { normalizeLookupInput } = require('../utils/address');

async function run() {
  const cases = [
    { address: '123 Main Street, Austin, TX 78701', city: '', state: 'TX' },
    { address: '123 Main Street', city: 'Austin', state: 'TX', zipCode: '78701' },
    { address: '123 Main St', city: 'Austin', state: 'TX' }
  ];

  for (const input of cases) {
    const normalized = normalizeLookupInput(input);
    try {
      const result = await PropertyAppraiserService.lookupByAddress(input);
      console.log('OK', JSON.stringify(input), '->', result.property.address, result.ownerContact.name);
    } catch (error) {
      console.log('FAIL', JSON.stringify(input), normalized, error.message || error);
    }
  }

  process.exit(0);
}

run();
