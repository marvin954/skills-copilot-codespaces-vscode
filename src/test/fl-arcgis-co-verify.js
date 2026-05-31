const axios = require('axios');

const QUERY_URL =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function probe(coNo, where, timeout = 30000) {
  const start = Date.now();
  try {
    const r = await axios.post(
      QUERY_URL,
      new URLSearchParams({
        f: 'json',
        where,
        outFields: 'CO_NO,PHY_CITY,PHY_ADDR1,PARCEL_ID,OWN_NAME',
        returnGeometry: 'false',
        resultRecordCount: '5'
      }),
      { timeout, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return {
      coNo,
      ms: Date.now() - start,
      count: r.data?.features?.length || 0,
      samples: r.data?.features?.map((f) => f.attributes) || [],
      error: r.data?.error?.message
    };
  } catch (e) {
    return { coNo, ms: Date.now() - start, error: e.code || e.message };
  }
}

async function main() {
  const tests = [
    { co: 16, label: 'Broward Andrews', where: "CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('100 N ANDREWS%')" },
    { co: 16, label: 'Broward Hollywood', where: "CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('2501 HOLLYWOOD%')" },
    { co: 23, label: 'Miami-Dade Biscayne', where: "CO_NO=23 AND UPPER(PHY_ADDR1) LIKE UPPER('100 BISCAYNE%')" },
    { co: 39, label: 'Hillsborough Tampa', where: "CO_NO=39 AND UPPER(PHY_ADDR1) LIKE UPPER('420 BAY%')" },
    { co: 6, label: 'Wrong DOR Broward', where: "CO_NO=6 AND UPPER(PHY_ADDR1) LIKE UPPER('100 N ANDREWS%')", timeout: 15000 }
  ];

  for (const t of tests) {
    const r = await probe(t.co, t.where, t.timeout || 30000);
    console.log(t.label, JSON.stringify(r, null, 2));
  }
}

main().catch(console.error);
