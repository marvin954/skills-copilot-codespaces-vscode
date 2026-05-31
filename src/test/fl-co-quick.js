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
        outFields: 'CO_NO,PHY_CITY,PHY_ADDR1,OWN_NAME,PARCEL_ID',
        returnGeometry: 'false',
        resultRecordCount: '15'
      }),
      { timeout: 45000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log(`${Date.now() - started}ms`, where, 'count', response.data.features?.length || 0);
    if (response.data.error) console.log(' error', response.data.error.message);
    (response.data.features || []).slice(0, 5).forEach((feature) => console.log(' ', feature.attributes));
  } catch (error) {
    console.log('ERR', where, error.message);
  }
}

async function main() {
  await query("CO_NO=11 AND UPPER(PHY_ADDR1) LIKE UPPER('100%')");
  await query("CO_NO=6 AND UPPER(PHY_ADDR1) LIKE UPPER('100%')");
  await query("CO_NO=13 AND UPPER(PHY_ADDR1) LIKE UPPER('100%')");
}

main();
