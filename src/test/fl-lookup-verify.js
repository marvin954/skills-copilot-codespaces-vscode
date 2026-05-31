const axios = require('axios');
const { geocodeAddress } = require('../services/GeocodingService');

const url =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function cityQuery(city, streetNum) {
  const where = `UPPER(PHY_CITY)='${city.toUpperCase()}' AND UPPER(PHY_ADDR1) LIKE UPPER('${streetNum}%')`;
  const started = Date.now();
  const response = await axios.post(
    url,
    new URLSearchParams({
      f: 'json',
      where,
      outFields: 'CO_NO,PHY_CITY,PHY_ADDR1,OWN_NAME',
      returnGeometry: 'false',
      resultRecordCount: '15'
    }),
    { timeout: 90000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  console.log(`${Date.now() - started}ms`, where, response.data.features?.length || 0);
  (response.data.features || []).slice(0, 5).forEach((f) => console.log(f.attributes));
}

async function main() {
  const geo = await geocodeAddress({
    address: '100 Biscayne Boulevard',
    city: 'Miami',
    state: 'FL',
    zipCode: '33132'
  });
  console.log('geocode', geo);
  await cityQuery('MIAMI', '100');
  await cityQuery('FORT LAUDERDALE', '100');
}

main().catch(console.error);
