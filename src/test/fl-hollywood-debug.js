const axios = require('axios');

const QUERY_URL =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function q(where) {
  const r = await axios.post(
    QUERY_URL,
    new URLSearchParams({
      f: 'json',
      where,
      outFields: 'PHY_ADDR1,PHY_CITY,PARCEL_ID',
      returnGeometry: 'false',
      resultRecordCount: '2000'
    }),
    { timeout: 90000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const feats = r.data?.features || [];
  console.log(where, 'count', feats.length);
  const hollywood = feats.filter((f) =>
    (f.attributes?.PHY_CITY || '').includes('HOLLYWOOD') &&
    (f.attributes?.PHY_ADDR1 || '').includes('2501')
  );
  console.log('hollywood 2501 matches', hollywood.length);
  hollywood.slice(0, 5).forEach((f) => console.log(f.attributes));
}

async function main() {
  await q("CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('2500%')");
  await q("CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('250%')");
}

main().catch(console.error);
