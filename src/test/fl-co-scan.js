const axios = require('axios');

const url =
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

async function findCoForCity(cityName, streetNum = '100') {
  for (let co = 1; co <= 67; co += 1) {
    try {
      const r = await axios.post(
        url,
        new URLSearchParams({
          f: 'json',
          where: `CO_NO=${co} AND UPPER(PHY_ADDR1) LIKE UPPER('${streetNum}%')`,
          outFields: 'CO_NO,PHY_CITY,PHY_ADDR1',
          returnGeometry: 'false',
          resultRecordCount: '25'
        }),
        { timeout: 15000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const hit = r.data.features?.find(
        (f) => f.attributes?.PHY_CITY?.toUpperCase() === cityName.toUpperCase()
      );
      if (hit) {
        console.log('FOUND', cityName, 'in CO_NO', co, hit.attributes);
        return co;
      }
    } catch {
      // skip
    }
  }
  console.log('NOT FOUND', cityName);
  return null;
}

async function main() {
  await findCoForCity('FORT LAUDERDALE', '100');
  await findCoForCity('HOLLYWOOD', '100');
  await findCoForCity('MIAMI', '100');
}

main();
