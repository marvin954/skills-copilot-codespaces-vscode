const axios = require('axios');

const QUERY_URL =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function probe(coNo, streetNumber, timeout = 15000) {
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
        resultRecordCount: '15'
      }),
      { timeout, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const feats = r.data?.features || [];
    return {
      coNo,
      ms: Date.now() - start,
      count: feats.length,
      cities: [...new Set(feats.map((f) => f.attributes?.PHY_CITY))],
      samples: feats.slice(0, 2).map((f) => f.attributes)
    };
  } catch (e) {
    return { coNo, ms: Date.now() - start, error: e.code || e.message };
  }
}

async function main() {
  // FIPS county codes (without state prefix) for major counties
  const fipsCandidates = [1, 3, 5, 11, 16, 21, 29, 57, 86, 95, 103];
  console.log('FIPS-based CO_NO probe with street 100...');
  for (const co of fipsCandidates) {
    console.log(JSON.stringify(await probe(co, '100')));
  }

  console.log('\nLooking for FORT LAUDERDALE in CO_NO=11 with ANDREWS...');
  const where = "CO_NO=11 AND UPPER(PHY_ADDR1) LIKE UPPER('100 N ANDREWS%')";
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
      { timeout: 30000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('CO11 Andrews:', r.data?.features?.map((f) => f.attributes));
  } catch (e) {
    console.log('CO11 Andrews error:', e.message);
  }

  for (const co of [6, 11, 86, 57]) {
    const where2 = `CO_NO=${co} AND UPPER(PHY_ADDR1) LIKE UPPER('100 N ANDREWS%')`;
    try {
      const r = await axios.post(
        QUERY_URL,
        new URLSearchParams({
          f: 'json',
          where: where2,
          outFields: 'CO_NO,PHY_CITY,PHY_ADDR1,PARCEL_ID',
          returnGeometry: 'false',
          resultRecordCount: '5'
        }),
        { timeout: 30000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      console.log(`CO${co} Andrews:`, r.data?.features?.length, r.data?.features?.[0]?.attributes);
    } catch (e) {
      console.log(`CO${co} Andrews error:`, e.message);
    }
  }
}

main().catch(console.error);
