const axios = require('axios');

const QUERY_URL =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function q(label, where, timeout = 60000) {
  const start = Date.now();
  try {
    const r = await axios.post(
      QUERY_URL,
      new URLSearchParams({
        f: 'json',
        where,
        outFields: 'PHY_ADDR1,PHY_CITY,PARCEL_ID,OWN_NAME',
        returnGeometry: 'false',
        resultRecordCount: '10'
      }),
      { timeout, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log(label, `${Date.now() - start}ms`, 'count', r.data?.features?.length, r.data?.error?.message);
    r.data?.features?.slice(0, 3).forEach((f) => console.log(' ', f.attributes));
  } catch (e) {
    console.log(label, `${Date.now() - start}ms`, 'error', e.code || e.message);
  }
}

async function main() {
  await q('andrews prefix', "CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('100 N ANDREWS%')");
  await q('hollywood prefix', "CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('2501 HOLLYWOOD%')");
  await q('hollywood short', "CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('2501%')");
  await q('miami co23', "CO_NO=23 AND UPPER(PHY_ADDR1) LIKE UPPER('100 BISCAYNE%')");
  await q('miami co30', "CO_NO=30 AND UPPER(PHY_ADDR1) LIKE UPPER('100 BISCAYNE%')");
}

main().catch(console.error);
