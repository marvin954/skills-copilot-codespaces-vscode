const axios = require('axios');

const url =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function query(where) {
  const started = Date.now();
  try {
    const response = await axios.post(
      url,
      new URLSearchParams({
        f: 'json',
        where,
        outFields: 'PHY_ADDR1,PHY_CITY,OWN_NAME',
        returnGeometry: 'false',
        resultRecordCount: '15'
      }),
      { timeout: 25000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const features = response.data.features || [];
    console.log(`${Date.now() - started}ms`, where, features.length);
    features.forEach((f) => console.log(f.attributes));
  } catch (e) {
    console.log(`${Date.now() - started}ms ERR`, where, e.message);
  }
}

async function main() {
  await query("UPPER(PHY_CITY)='FORT LAUDERDALE' AND UPPER(PHY_ADDR1) LIKE UPPER('100 N%')");
  await query("UPPER(PHY_CITY)='FORT LAUDERDALE' AND UPPER(PHY_ADDR1) LIKE UPPER('100%')");
}

main();
