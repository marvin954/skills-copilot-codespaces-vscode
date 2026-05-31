/**
 * Sample addresses available in demo mode (not live county API data).
 */
const DEMO_ADDRESSES_BY_STATE = {
  FL: [
    '100 NE 10 St, Pompano Beach, FL 33060',
    '100 N Andrews Ave, Fort Lauderdale, FL 33301',
    '100 Biscayne Boulevard, Miami, FL 33132',
    '420 Bay Street, Tampa, FL 33602',
    '800 Orange Avenue, Orlando, FL 32801'
  ],
  TX: [
    '123 Main Street, Austin, TX 78701',
    '456 Oak Avenue, Austin, TX 78702',
    '111 Commerce Street, Dallas, TX 75201',
    '555 Energy Avenue, Houston, TX 77001'
  ]
};

function getLookupHint(state) {
  const code = state?.toUpperCase();
  const samples = DEMO_ADDRESSES_BY_STATE[code] || [
    ...DEMO_ADDRESSES_BY_STATE.FL,
    ...DEMO_ADDRESSES_BY_STATE.TX
  ];

  if (code === 'FL') {
    return {
      hint: 'This demo only includes sample Florida parcels — not every real address. Try one of the examples below, or connect a county Property Appraiser API for live lookups.',
      sampleAddresses: DEMO_ADDRESSES_BY_STATE.FL
    };
  }

  if (code === 'TX') {
    return {
      hint: 'This demo only includes sample Texas parcels. Try one of the examples below.',
      sampleAddresses: DEMO_ADDRESSES_BY_STATE.TX
    };
  }

  return {
    hint: 'This demo only includes sample parcels in Florida and Texas — not live county records for every address.',
    sampleAddresses: samples.slice(0, 4)
  };
}

module.exports = { DEMO_ADDRESSES_BY_STATE, getLookupHint };
