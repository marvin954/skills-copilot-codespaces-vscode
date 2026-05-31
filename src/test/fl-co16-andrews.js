const axios = require('axios');
const url =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function q(where) {
  const t = Date.now();
  try {
    const r = await axios.post(
      url,
      new URLSearchParams({
        f: 'json',
        where,
        outFields: 'PHY_ADDR1,PHY_CITY,OWN_NAME',
        returnGeometry: 'false',
        resultRecordCount: '25'
      }),
      { timeout: 60000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const feats = r.data.features || [];
    console.log(`${Date.now() - t}ms`, where, feats.length);
    feats.forEach((f) => console.log(f.attributes));
  } catch (e) {
    console.log(`${Date.now() - t}ms ERR`, e.message);
  }
}

q("CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('100 N%')");
q("CO_NO=16 AND UPPER(PHY_ADDR1) LIKE UPPER('100 N ANDREWS%')");
