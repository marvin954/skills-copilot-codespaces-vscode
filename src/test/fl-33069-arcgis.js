const axios = require('axios');
const url =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function q(where) {
  const r = await axios.post(
    url,
    new URLSearchParams({
      f: 'json',
      where,
      outFields: 'PHY_ADDR1,PHY_CITY,PHY_ZIPCD',
      returnGeometry: 'false',
      resultRecordCount: '10'
    }),
    { timeout: 60000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  console.log(where, (r.data.features || []).length, r.data.error?.message || '');
  (r.data.features || []).slice(0, 5).forEach((f) => console.log(f.attributes));
}

q("CO_NO=16 AND PHY_ZIPCD='33069'").catch((e) => console.error(e.message));
