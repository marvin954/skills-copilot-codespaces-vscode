const axios = require('axios');

const QUERY_URL =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function query(coNo, streetNumber) {
  const where = `CO_NO=${coNo} AND UPPER(PHY_ADDR1) LIKE UPPER('${streetNumber}%')`;
  const r = await axios.post(
    QUERY_URL,
    new URLSearchParams({
      f: 'json',
      where,
      outFields: 'CO_NO,PHY_CITY,PHY_ADDR1,PARCEL_ID,OWN_NAME',
      returnGeometry: 'false',
      resultRecordCount: '2000'
    }),
    { timeout: 90000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return r.data?.features || [];
}

async function main() {
  const feats = await query(16, '100');
  console.log('Total CO16/100:', feats.length);
  const cities = [...new Set(feats.map((f) => f.attributes?.PHY_CITY))].sort();
  console.log('Cities sample:', cities.slice(0, 20));
  const andrews = feats.filter((f) => (f.attributes?.PHY_ADDR1 || '').toUpperCase().includes('ANDREWS'));
  console.log('Andrews matches:', andrews.length);
  console.log(andrews.slice(0, 5).map((f) => f.attributes));

  const hollywood = await query(16, '2501');
  console.log('\nTotal CO16/2501:', hollywood.length);
  const hollywoodFiltered = hollywood.filter((f) =>
    (f.attributes?.PHY_ADDR1 || '').toUpperCase().includes('HOLLYWOOD')
  );
  console.log('Hollywood blvd matches:', hollywoodFiltered.length);
  console.log(hollywoodFiltered.slice(0, 5).map((f) => f.attributes));
}

main().catch(console.error);
