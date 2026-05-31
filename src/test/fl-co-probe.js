const axios = require('axios');

const QUERY_URL =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function probe(coNo, streetNumber, timeout = 20000) {
  const where = `CO_NO=${coNo} AND UPPER(PHY_ADDR1) LIKE UPPER('${streetNumber}%')`;
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
    const feats = r.data?.features || [];
    return {
      coNo,
      ms: Date.now() - start,
      count: feats.length,
      cities: [...new Set(feats.map((f) => f.attributes?.PHY_CITY))],
      samples: feats.slice(0, 3).map((f) => f.attributes)
    };
  } catch (e) {
    return { coNo, ms: Date.now() - start, error: e.code || e.message };
  }
}

async function main() {
  const cos = [1, 6, 11, 13, 16, 29, 50, 58];
  console.log('Probing CO_NO values with street 100...');
  for (const co of cos) {
    const r = await probe(co, '100');
    console.log(JSON.stringify(r));
  }

  console.log('\nProbing CO_NO=50 with 2501 (Hollywood Blvd)...');
  console.log(JSON.stringify(await probe(50, '2501')));

  console.log('\nProbing CO_NO=6 with 2501...');
  console.log(JSON.stringify(await probe(6, '2501', 45000)));
}

main().catch(console.error);
