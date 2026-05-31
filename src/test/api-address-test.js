const axios = require('axios');

async function main() {
  const payload = {
    address: '100 NE 10 St',
    city: 'Pompano Beach',
    state: 'FL',
    zipCode: '33069'
  };
  const start = Date.now();
  try {
    const res = await axios.post('http://localhost:5000/api/search/address', payload, { timeout: 180000 });
    console.log('OK', Date.now() - start, 'ms', res.data.data?.property?.address, res.data.data?.property?.owner_name);
  } catch (err) {
    console.log('ERR', Date.now() - start, 'ms', err.response?.status, err.response?.data?.message || err.message);
    console.log(JSON.stringify(err.response?.data, null, 2));
  }
}

main();
