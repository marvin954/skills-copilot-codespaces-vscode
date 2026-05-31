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
      outFields: 'CO_NO,PHY_CITY,PHY_ADDR1,OWN_NAME,PARCEL_ID',
      returnGeometry: 'false',
      resultRecordCount: '15'
    }),
    { timeout: 90000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const features = response.data.features || [];
  console.log(`${Date.now() - started}ms`, where, features.length, response.data.error?.message || '');
  features.forEach((f) => console.log(f.attributes));
  const andrews = features.filter((f) => f.attributes.PHY_ADDR1?.toUpperCase().includes('ANDREWS'));
  console.log('Andrews matches:', andrews.length);
}

async function main() {
  await query("CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('100%')");
  await query("UPPER(PHY_CITY)='FORT LAUDERDALE' AND UPPER(PHY_ADDR1) LIKE UPPER('100 N%')");
  await query("UPPER(PHY_CITY)='FORT LAUDERDALE' AND UPPER(PHY_ADDR1) LIKE UPPER('100%')");
}

main();
