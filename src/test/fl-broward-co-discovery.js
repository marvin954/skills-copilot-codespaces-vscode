const axios = require('axios');

const QUERY_URL =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function queryCo(coNo, city) {
  const where = `CO_NO=${coNo} AND UPPER(PHY_CITY) LIKE UPPER('${city}%')`;
  try {
    const r = await axios.post(
      QUERY_URL,
      new URLSearchParams({
        f: 'json',
        where,
        outFields: 'CO_NO,PHY_CITY,PHY_ADDR1',
        returnGeometry: 'false',
        resultRecordCount: '3'
      }),
      { timeout: 45000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const feats = r.data?.features || [];
    return {
      coNo,
      count: feats.length,
      cities: [...new Set(feats.map((f) => f.attributes?.PHY_CITY))],
      sample: feats[0]?.attributes?.PHY_ADDR1
    };
  } catch (e) {
    return { coNo, error: e.message };
  }
}

async function queryStreet(coNo, streetNumber) {
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
        resultRecordCount: '5'
      }),
      { timeout: 60000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const feats = r.data?.features || [];
    return {
      coNo,
      ms: Date.now() - start,
      count: feats.length,
      samples: feats.map((f) => f.attributes)
    };
  } catch (e) {
    return { coNo, ms: Date.now() - start, error: e.message };
  }
}

async function main() {
  const cities = ['FORT LAUDERDALE', 'HOLLYWOOD', 'POMPANO BEACH'];
  console.log('=== City to CO_NO discovery ===');
  for (const city of cities) {
    console.log(`\n--- ${city} ---`);
    for (let co = 1; co <= 67; co++) {
      const r = await queryCo(co, city);
      if (r.count > 0) console.log(JSON.stringify(r));
    }
  }

  console.log('\n=== Street number queries for known addresses ===');
  const tests = [
    { co: 6, num: '100', label: 'Fort Lauderdale CO6' },
    { co: 11, num: '100', label: 'CO11' },
    { co: 50, num: '100', label: 'Palm Beach CO50' },
    { co: 13, num: '100', label: 'Miami CO13' }
  ];
  for (const t of tests) {
    const r = await queryStreet(t.co, t.num);
    console.log(t.label, JSON.stringify(r, null, 2));
  }
}

main().catch(console.error);
