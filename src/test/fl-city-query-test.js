const axios = require('axios');

const url =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function tryWhere(where) {
  const started = Date.now();
  try {
    const response = await axios.post(
      url,
      new URLSearchParams({
        f: 'json',
        where,
        outFields: 'CO_NO,PHY_CITY,PHY_ADDR1',
        returnGeometry: 'false',
        resultRecordCount: '5'
      }),
      { timeout: 60000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log(`${Date.now() - started}ms`, where, response.data.features?.length || 0, response.data.error?.message || '');
    (response.data.features || []).forEach((f) => console.log(f.attributes));
  } catch (error) {
    console.log(`${Date.now() - started}ms ERR`, where, error.message);
  }
}

async function main() {
  await tryWhere("UPPER(PHY_CITY)='FORT LAUDERDALE'");
  await tryWhere("UPPER(PHY_CITY)='FORT LAUDERDALE' AND UPPER(PHY_ADDR1) LIKE UPPER('100%')");
  await tryWhere("CO_NO=6 AND UPPER(PHY_CITY)='FORT LAUDERDALE'");
}

main();
