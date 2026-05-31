const axios = require('axios');
const url =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function q(where) {
  const t = Date.now();
  try {
    const r = await axios.post(
      url,
      new URLSearchParams({
        f: 'json',
        where,
        outFields: 'PHY_ADDR1,PHY_CITY,OWN_NAME,PARCEL_ID',
        returnGeometry: 'false',
        resultRecordCount: '10'
      }),
      { timeout: 60000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log(`${Date.now() - t}ms`, where, (r.data.features || []).length);
    (r.data.features || []).forEach((f) => console.log(f.attributes));
  } catch (e) {
    console.log(`${Date.now() - t}ms ERR`, e.message);
  }
}

async function main() {
  await q("CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('100 N ANDREWS AV%')");
  await q("CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('100 N ANDREWS AVE%')");
  await q("CO_NO=16 AND UPPER(PHY_CITY)='FORT LAUDERDALE' AND UPPER(PHY_ADDR1) LIKE UPPER('100 N ANDREWS%')");
}

main();
