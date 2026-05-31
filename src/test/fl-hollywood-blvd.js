const axios = require('axios');

const QUERY_URL =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function main() {
  const r = await axios.post(
    QUERY_URL,
    new URLSearchParams({
      f: 'json',
      where: "CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('250%')",
      outFields: 'PHY_ADDR1,PHY_CITY,PARCEL_ID,OWN_NAME',
      returnGeometry: 'false',
      resultRecordCount: '2000'
    }),
    { timeout: 90000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const feats = r.data?.features || [];
  const blvd = feats.filter((f) => {
    const addr = (f.attributes?.PHY_ADDR1 || '').toUpperCase();
    return addr.includes('HOLLYWOOD') && addr.includes('BLVD');
  });
  console.log('Hollywood Blvd total:', blvd.length);
  blvd.filter((f) => (f.attributes?.PHY_ADDR1 || '').includes('2501')).forEach((f) => console.log(f.attributes));
  blvd.slice(0, 15).forEach((f) => console.log(f.attributes));
}

main().catch(console.error);
