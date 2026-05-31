const axios = require('axios');

const url = 'https://gis.fortlauderdale.gov/server/rest/services/TaxParcel/FeatureServer/0/query';

async function query(where) {
  const started = Date.now();
  const response = await axios.get(url, {
    params: {
      f: 'json',
      where,
      outFields: 'SITEADDRESS,SITEADDRPSTL,OWNERNME1,PARCELID,BLDGVAL,LNDVAL',
      returnGeometry: 'false',
      resultRecordCount: 5
    },
    timeout: 20000
  });
  console.log(`${Date.now() - started}ms`, where, response.data.features?.length || 0);
  (response.data.features || []).forEach((f) => console.log(f.attributes));
}

async function main() {
  await query("UPPER(SITEADDRESS) LIKE '%ANDREWS%'");
  await query("UPPER(SITEADDRESS) LIKE '100%'");
  await query("UPPER(SITEADDRESS) LIKE '%100 N%'");
}

main().catch((e) => console.error(e.message));
