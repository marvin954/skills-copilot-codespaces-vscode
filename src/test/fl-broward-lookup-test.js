const { lookupByAddress } = require('../services/FlArcGisParcelProvider');

async function main() {
  const tests = [
    { address: '100 N Andrews Ave', city: 'Fort Lauderdale', state: 'FL', zipCode: '33301' },
    { address: '2501 Hollywood Blvd', city: 'Hollywood', state: 'FL', zipCode: '33020' }
  ];

  for (const input of tests) {
    const start = Date.now();
    console.log(`\n=== ${input.address}, ${input.city} ===`);
    try {
      const result = await lookupByAddress(input);
      console.log(result ? 'FOUND' : 'NOT FOUND', `${Date.now() - start}ms`);
      if (result) {
        console.log('parcel:', result.property.parcel_number);
        console.log('address:', result.property.address);
        console.log('city:', result.property.city);
        console.log('owner:', result.property.owner_name);
        console.log('district:', result.appraiser.district);
      }
    } catch (e) {
      console.log('ERROR', e.message);
    }
  }
}

main().catch(console.error);
