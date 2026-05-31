const axios = require('axios');

const url =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function q(where) {
  const r = await axios.post(
    url,
    new URLSearchParams({
      f: 'json',
      where,
      outFields: 'PARCEL_ID,PHY_ADDR1,PHY_CITY,OWN_NAME,CO_NO',
      returnGeometry: 'false',
      resultRecordCount: '5'
    }),
    { timeout: 60000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  console.log(where, r.data.features?.length || r.data.error?.message);
  r.data.features?.forEach((f) => console.log(' ', f.attributes));
}

async function main() {
  for (const co of [13, 23, 6, 11, 29, 48]) {
    await q(`CO_NO=${co} AND UPPER(PHY_ADDR1) LIKE UPPER('100 BISCAYNE%')`);
  }
}

main().catch(console.error);
