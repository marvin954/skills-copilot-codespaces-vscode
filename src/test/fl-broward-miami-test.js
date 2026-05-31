const axios = require('axios');

const url =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function query(where, label) {
  const started = Date.now();
  const response = await axios.post(
    url,
    new URLSearchParams({
      f: 'json',
      where,
      outFields: 'CO_NO,PHY_CITY,PHY_ADDR1,OWN_NAME,PARCEL_ID,PHY_ZIPCD',
      returnGeometry: 'false',
      resultRecordCount: '50'
    }),
    { timeout: 90000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const features = response.data.features || [];
  console.log(`\n${label} (${Date.now() - started}ms) count=${features.length}`);
  if (response.data.error) console.log('error', response.data.error.message);
  features.forEach((f) => console.log(f.attributes));
  return features;
}

async function main() {
  const ftl = await query(
    "UPPER(PHY_CITY)='FORT LAUDERDALE' AND UPPER(PHY_ADDR1) LIKE UPPER('100%')",
    'FTL 100%'
  );
  console.log(
    'Andrews hits:',
    ftl.filter((f) => f.attributes.PHY_ADDR1?.toUpperCase().includes('ANDREWS')).length
  );

  await query("UPPER(PHY_CITY)='HOLLYWOOD' AND UPPER(PHY_ADDR1) LIKE UPPER('2501%')", 'Hollywood 2501%');
  await query("UPPER(PHY_CITY)='HOLLYWOOD' AND UPPER(PHY_ADDR1) LIKE UPPER('250%')", 'Hollywood 250%');

  for (const co of [16, 30, 31, 37, 48, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60]) {
    try {
      const r = await axios.post(
        url,
        new URLSearchParams({
          f: 'json',
          where: `CO_NO=${co} AND UPPER(PHY_ADDR1) LIKE UPPER('100%')`,
          outFields: 'CO_NO,PHY_CITY,PHY_ADDR1',
          returnGeometry: 'false',
          resultRecordCount: '50'
        }),
        { timeout: 15000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const miami = (r.data.features || []).filter((f) => f.attributes.PHY_CITY?.toUpperCase() === 'MIAMI');
      if (miami.length) {
        console.log(`\nMIAMI in CO_NO=${co}`, miami[0].attributes);
      }
    } catch {
      // skip
    }
  }
}

main().catch((e) => console.error(e.message));
