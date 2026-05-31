/**
 * Free US address geocoding via US Census Bureau (no API key).
 */
const axios = require('axios');

const CENSUS_LOCATION = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';
const CENSUS_GEOGRAPHIES = 'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress';

async function geocodeAddress({ address, city, state, zipCode }) {
  const line = [address, city, state, zipCode].filter(Boolean).join(', ');

  const [locationResponse, geographyResponse] = await Promise.all([
    axios.get(CENSUS_LOCATION, {
      params: {
        address: line,
        benchmark: 'Public_AR_Current',
        format: 'json'
      },
      timeout: 12000
    }),
    axios
      .get(CENSUS_GEOGRAPHIES, {
        params: {
          address: line,
          benchmark: 'Public_AR_Current',
          vintage: 'Current_Current',
          format: 'json'
        },
        timeout: 12000
      })
      .catch(() => null)
  ]);

  const match = locationResponse.data?.result?.addressMatches?.[0];
  if (!match?.coordinates) {
    return null;
  }

  const geoMatch = geographyResponse?.data?.result?.addressMatches?.[0];
  const countyGeo = geoMatch?.geographies?.['Counties']?.[0];

  return {
    latitude: match.coordinates.y,
    longitude: match.coordinates.x,
    matchedAddress: match.matchedAddress,
    city: match.addressComponents?.city || city || null,
    county: countyGeo?.NAME || null,
    countyFips: countyGeo?.GEOID || null,
    state: match.addressComponents?.state || state || null,
    zipCode: match.addressComponents?.zip || zipCode || null,
    streetNumber: match.addressComponents?.fromAddress || null,
    preDirection: match.addressComponents?.preDirection || null,
    streetName: match.addressComponents?.streetName || null,
    suffixType: match.addressComponents?.suffixType || null,
    source: 'us_census_geocoder'
  };
}

module.exports = { geocodeAddress };
