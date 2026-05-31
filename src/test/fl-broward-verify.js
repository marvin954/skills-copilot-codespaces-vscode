const axios = require('axios');

const url =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function query(where) {
  const started = Date.now();
  const response = await axios.post(
    url,
    new URLSearchParams({
      f: 'json',
      where,
      outFields: 'CO_NO,PHY_CITY,PHY_ADDR1,OWN_NAME,PARCEL_ID,PHY_ZIPCD',
      returnGeometry: 'false',
      resultRecordCount: '15'
    }),
    { timeout: 90000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  console.log(`${Date.now() - started}ms`, where, response.data.features?.length || 0, response.data.error?.message || '');
  (response.data.features || []).forEach((f) => console.log(f.attributes));
}

async function main() {
  await query("UPPER(PHY_CITY)='FORT LAUDERDALE' AND UPPER(PHY_ADDR1) LIKE UPPER('100%')");
  await query("UPPER(PHY_CITY)='HOLLYWOOD' AND UPPER(PHY_ADDR1) LIKE UPPER('2501%')");
}

main();
