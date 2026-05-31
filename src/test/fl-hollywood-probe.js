const axios = require('axios');

const QUERY_URL =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function q(where, timeout = 60000) {
  const start = Date.now();
  const r = await axios.post(
    QUERY_URL,
    new URLSearchParams({
      f: 'json',
      where,
      outFields: 'PHY_ADDR1,PHY_CITY,PARCEL_ID,OWN_NAME',
      returnGeometry: 'false',
      resultRecordCount: '20'
    }),
    { timeout, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  console.log(`${Date.now() - start}ms`, where);
  console.log('count', r.data?.features?.length, r.data?.error?.message);
  r.data?.features?.slice(0, 5).forEach((f) => console.log(' ', f.attributes));
}

async function main() {
  await q("CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('100%') AND UPPER(PHY_ADDR1) LIKE UPPER('%ANDREWS%')");
  await q("CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('%2501%') AND UPPER(PHY_ADDR1) LIKE UPPER('%HOLLYWOOD%')");
  await q("CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('%HOLLYWOOD BLVD%') AND UPPER(PHY_ADDR1) LIKE UPPER('2501%')");
  await q("CO_NO=16 AND UPPER(PHY_CITY) LIKE UPPER('HOLLYWOOD%') AND UPPER(PHY_ADDR1) LIKE UPPER('2501%')");
}

main().catch((e) => console.error(e.message));
