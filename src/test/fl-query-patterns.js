const axios = require('axios');

const QUERY_URL =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function tryWhere(label, where, timeout = 60000) {
  const start = Date.now();
  try {
    const r = await axios.post(
      QUERY_URL,
      new URLSearchParams({
        f: 'json',
        where,
        outFields: 'CO_NO,PHY_CITY,PHY_ADDR1,PARCEL_ID',
        returnGeometry: 'false',
        resultRecordCount: '10'
      }),
      { timeout, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log(label, `${Date.now() - start}ms`, 'count', r.data?.features?.length, r.data?.features?.[0]?.attributes || r.data?.error?.message);
  } catch (e) {
    console.log(label, `${Date.now() - start}ms`, 'error', e.code || e.message);
  }
}

async function main() {
  const patterns = [
    ["CO16 num only", "CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('100%')"],
    ["CO16 num+dir", "CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('100 N%')"],
    ["CO16 num+token", "CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('100%ANDREWS%')"],
    ["CO16 andrews", "CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('%ANDREWS%') AND UPPER(PHY_ADDR1) LIKE UPPER('100%')"],
    ["CO16 hollywood", "CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('2501 HOLLYWOOD%')"],
    ["CO16 hollywood2", "CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('2501%HOLLYWOOD%')"]
  ];
  for (const [label, where] of patterns) {
    await tryWhere(label, where);
  }
}

main().catch(console.error);
