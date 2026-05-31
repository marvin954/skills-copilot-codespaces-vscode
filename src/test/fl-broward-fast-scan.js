const axios = require('axios');

const QUERY_URL =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

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
        resultRecordCount: '25'
      }),
      { timeout: 60000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return {
      coNo,
      ms: Date.now() - start,
      features: r.data?.features || [],
      error: r.data?.error?.message
    };
  } catch (e) {
    return { coNo, ms: Date.now() - start, features: [], error: e.message };
  }
}

async function findCityCo(cityName, streetNum) {
  console.log(`\nSearching CO_NO for ${cityName} via street ${streetNum}...`);
  const hits = [];
  const batchSize = 12;
  for (let i = 1; i <= 67; i += batchSize) {
    const batch = Array.from({ length: batchSize }, (_, j) => i + j).filter((n) => n <= 67);
    const results = await Promise.all(batch.map((co) => queryStreet(co, streetNum)));
    for (const r of results) {
      const match = r.features.find(
        (f) => f.attributes?.PHY_CITY?.toUpperCase() === cityName.toUpperCase()
      );
      if (match) {
        hits.push({
          coNo: r.coNo,
          ms: r.ms,
          attrs: match.attributes
        });
      }
    }
    if (hits.length) break;
  }
  console.log(JSON.stringify(hits, null, 2));
  return hits;
}

async function main() {
  await findCityCo('FORT LAUDERDALE', '100');
  await findCityCo('HOLLYWOOD', '2501');
  await findCityCo('POMPANO BEACH', '100');
}

main().catch(console.error);
