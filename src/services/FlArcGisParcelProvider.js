/**
 * On-demand Florida parcel lookup via FDOR Statewide Cadastral ArcGIS FeatureServer.
 * Uses geocoded county targeting + street-prefix queries with in-memory scoring.
 */
const axios = require('axios');
const { normalizeAddress } = require('../utils/address');
const { geocodeAddress } = require('./GeocodingService');
const { getCountyName, getQueryCoNos } = require('../data/flCountyCodes');
const MemoryPropertyStore = require('./MemoryPropertyStore');

const QUERY_URL =
  process.env.FL_ARCGIS_FEATURE_SERVER ||
  'https://services9.arcgis.com/Gh9awoU677aKree0/ArcGIS/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query';

const OUT_FIELDS = [
  'PARCEL_ID',
  'PARCELNO',
  'CO_NO',
  'OWN_NAME',
  'OWN_ADDR1',
  'OWN_ADDR2',
  'OWN_CITY',
  'OWN_STATE',
  'OWN_ZIPCD',
  'PHY_ADDR1',
  'PHY_ADDR2',
  'PHY_CITY',
  'PHY_ZIPCD',
  'S_LEGAL',
  'JV',
  'AV_NSD',
  'AV_SD',
  'LND_VAL',
  'TOT_LVG_AR',
  'ASMNT_YR'
].join(',');

const BATCH_SIZE = 8;
const PRIMARY_TIMEOUT_MS = 90000;
const SECONDARY_TIMEOUT_MS = 30000;
const MAX_RECORDS = '2000';

function escapeArcGis(value = '') {
  return String(value).replace(/'/g, "''");
}

function normalizeCity(city = '') {
  return city.trim().toLowerCase().replace(/\s+/g, ' ');
}

function extractStreetNumber(address = '') {
  const normalized = normalizeAddress(address);
  const match = normalized.match(/^\d+/);
  return match ? match[0] : normalized.split(' ')[0];
}

function addressNumberMatches(featureAddress, streetNumber) {
  if (!streetNumber || !featureAddress) return true;
  const normalized = normalizeAddress(featureAddress);
  const pattern = new RegExp(`^${streetNumber}(\\s|[^0-9]|$)`);
  return pattern.test(normalized);
}

function streetNameTokens(address = '') {
  const normalized = normalizeAddress(address);
  return normalized.split(' ').slice(1).filter((token) => token.length > 2);
}

function buildSearchPrefixes(address, geocode) {
  const prefixes = [];
  const normalized = normalizeAddress(address);
  const parts = normalized.split(' ').filter(Boolean);
  const streetNumber = extractStreetNumber(address);

  if (streetNumber) {
    prefixes.push(streetNumber);
    if (streetNumber.length >= 4) {
      prefixes.push(streetNumber.slice(0, 3));
    }
  }

  if (parts.length >= 2 && /^(n|s|e|w|ne|nw|se|sw)$/.test(parts[1])) {
    prefixes.push(`${parts[0]} ${parts[1]}`.toUpperCase());
  }

  if (parts.length >= 3) {
    prefixes.push(parts.slice(0, 3).join(' ').toUpperCase());
  }

  if (geocode?.streetNumber && geocode?.streetName) {
    const direction = geocode.preDirection ? `${geocode.preDirection} ` : '';
    const suffix = geocode.suffixType ? ` ${geocode.suffixType}` : '';
    prefixes.push(`${geocode.streetNumber} ${direction}${geocode.streetName}${suffix}`.trim().toUpperCase());
    prefixes.push(`${geocode.streetNumber} ${direction}${geocode.streetName}`.trim().toUpperCase());
  }

  return [...new Set(prefixes.filter(Boolean))];
}

function citiesMatch(inputCity, featureCity) {
  const left = normalizeCity(inputCity);
  const right = normalizeCity(featureCity);
  if (!left || !right) return true;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;
  if (left.includes('lauderdale') && right.includes('lauderdale')) return true;
  if (left.includes('hollywood') && right.includes('hollywood')) return true;
  if (left.includes('pompano') && right.includes('pompano')) return true;
  if (left.includes('beach') && right.includes('beach') && (left.includes('pompano') || left.includes('deerfield') || left.includes('hallandale'))) {
    return right.includes('pompano') || right.includes('deerfield') || right.includes('hallandale') || right.includes('beach');
  }
  return false;
}

function zipMatches(inputZip, featureZip) {
  if (!inputZip || !featureZip) return true;
  return String(inputZip).slice(0, 5) === String(featureZip).slice(0, 5);
}

function scoreMatch(inputAddress, featureAddress, inputCity, featureCity, inputZip, featureZip) {
  let score = 0;
  const input = normalizeAddress(inputAddress);
  const candidate = normalizeAddress(featureAddress || '');
  if (input === candidate) score += 0;
  else if (candidate.includes(input) || input.includes(candidate)) score += 2;
  else score += levenshtein(input, candidate);

  if (inputCity && featureCity && citiesMatch(inputCity, featureCity)) score -= 3;
  if (zipMatches(inputZip, featureZip)) score -= 2;
  return score;
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

function pickBestFeature(features, input) {
  if (!features?.length) return null;
  return [...features].sort((a, b) => {
    const scoreA = scoreMatch(
      input.address,
      a.attributes?.PHY_ADDR1,
      input.city,
      a.attributes?.PHY_CITY,
      input.zipCode,
      a.attributes?.PHY_ZIPCD
    );
    const scoreB = scoreMatch(
      input.address,
      b.attributes?.PHY_ADDR1,
      input.city,
      b.attributes?.PHY_CITY,
      input.zipCode,
      b.attributes?.PHY_ZIPCD
    );
    return scoreA - scoreB;
  })[0];
}

function filterFeatures(features, { address, city, zipCode }, { strictZip = true, strictCity = true } = {}) {
  const nameTokens = streetNameTokens(address);
  const streetNumber = extractStreetNumber(address);

  return (features || []).filter((feature) => {
    const attrs = feature.attributes || {};
    const featureAddress = normalizeAddress(attrs.PHY_ADDR1 || '');

    if (!addressNumberMatches(attrs.PHY_ADDR1, streetNumber)) return false;
    if (strictCity && city && !citiesMatch(city, attrs.PHY_CITY)) return false;
    if (strictZip && zipCode && attrs.PHY_ZIPCD && !zipMatches(zipCode, attrs.PHY_ZIPCD)) return false;
    if (nameTokens.length && !nameTokens.every((token) => featureAddress.includes(token))) return false;
    return true;
  });
}

async function queryArcGis(where, timeoutMs = SECONDARY_TIMEOUT_MS) {
  const response = await axios.post(
    QUERY_URL,
    new URLSearchParams({
      f: 'json',
      where,
      outFields: OUT_FIELDS,
      returnGeometry: 'false',
      resultRecordCount: MAX_RECORDS
    }),
    {
      timeout: timeoutMs,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );

  if (response.data?.error) {
    return [];
  }

  return response.data?.features || [];
}

async function queryCountyStreet(coNo, streetPrefix, timeoutMs = SECONDARY_TIMEOUT_MS) {
  const where = `CO_NO=${coNo} AND UPPER(PHY_ADDR1) LIKE UPPER('${escapeArcGis(streetPrefix)}%')`;
  return queryArcGis(where, timeoutMs);
}

async function searchStatewide({ address, city, zipCode, geocode }) {
  const streetNumber = extractStreetNumber(address);
  if (!streetNumber) return [];

  const resolvedCity = city || geocode?.city || '';
  const resolvedZip = zipCode || geocode?.zipCode || '';
  const prefixes = buildSearchPrefixes(address, geocode);
  const { primary, all: queryCoNos } = getQueryCoNos({
    city: resolvedCity,
    county: geocode?.county,
    geocodeCity: geocode?.city
  });

  const candidates = [];
  const seenParcels = new Set();

  const collect = (features, options) => {
    let filtered = filterFeatures(features, {
      address,
      city: resolvedCity,
      zipCode: resolvedZip
    }, options);

    if (!filtered.length && features?.length) {
      filtered = filterFeatures(features, {
        address,
        city: geocode?.city || resolvedCity,
        zipCode: resolvedZip
      }, { strictZip: false, strictCity: options?.strictCity !== false });
    }

    if (!filtered.length && features?.length) {
      filtered = filterFeatures(features, {
        address,
        city: resolvedCity,
        zipCode: resolvedZip
      }, { strictZip: false, strictCity: false });
    }

    for (const feature of filtered) {
      const parcelId = feature.attributes?.PARCEL_ID || feature.attributes?.PARCELNO;
      const key = parcelId ? String(parcelId) : JSON.stringify(feature.attributes || {});
      if (seenParcels.has(key)) continue;
      seenParcels.add(key);
      candidates.push(feature);
    }
  };

  const targetCoNos = primary ? [primary, ...queryCoNos.filter((co) => co !== primary)] : queryCoNos;

  for (const coNo of targetCoNos) {
    if (candidates.length > 0) break;

    const timeout = coNo === primary ? PRIMARY_TIMEOUT_MS : SECONDARY_TIMEOUT_MS;
    for (const prefix of prefixes) {
      const features = await queryCountyStreet(coNo, prefix, timeout).catch(() => []);
      collect(features);
      if (candidates.length > 0) break;
    }
  }

  if (candidates.length > 0) {
    return candidates;
  }

  for (let index = 0; index < queryCoNos.length; index += BATCH_SIZE) {
    const batch = queryCoNos.slice(index, index + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((coNo) => queryCountyStreet(coNo, streetNumber, SECONDARY_TIMEOUT_MS).catch(() => []))
    );

    for (const features of batchResults) {
      collect(features);
    }
  }

  return candidates;
}

function formatMailingAddress(attrs) {
  const parts = [attrs.OWN_ADDR1, attrs.OWN_ADDR2, attrs.OWN_CITY, attrs.OWN_STATE, attrs.OWN_ZIPCD]
    .filter(Boolean)
    .join(', ')
    .replace(/,\s*,/g, ',');
  return parts || null;
}

function toLiveProperty(attrs, geocode) {
  const parcelId = attrs.PARCEL_ID || attrs.PARCELNO;
  const justValue = Number(attrs.JV) || null;
  const landValue = Number(attrs.LND_VAL) || null;
  const assessedValue = Number(attrs.AV_NSD || attrs.AV_SD || attrs.JV) || null;
  const countyName = getCountyName(Number(attrs.CO_NO)) || geocode?.county || null;

  return {
    id: `live-${String(parcelId).replace(/[^a-zA-Z0-9_-]/g, '_')}`,
    parcel_number: parcelId,
    address: attrs.PHY_ADDR1,
    city: attrs.PHY_CITY,
    state: 'FL',
    zip_code: attrs.PHY_ZIPCD,
    owner_name: attrs.OWN_NAME,
    owner_mailing_address: formatMailingAddress(attrs),
    tax_assessed_value: assessedValue,
    land_value: landValue,
    improvement_value: justValue != null && landValue != null ? Math.max(justValue - landValue, 0) : null,
    legal_description: attrs.S_LEGAL,
    square_feet: Number(attrs.TOT_LVG_AR) || null,
    bedrooms: null,
    bathrooms: null,
    property_type: null,
    year_built: null,
    appraiser_district: countyName
      ? `${countyName} County Property Appraiser (FDOR)`
      : 'Florida FDOR Statewide Cadastral',
    contact_source: 'Florida Property Appraiser public record (FDOR)',
    data_source: 'florida_fdor_arcgis',
    latitude: geocode?.latitude ?? null,
    longitude: geocode?.longitude ?? null,
    assessment_year: attrs.ASMNT_YR
  };
}

function toLookupPayload(property, geocode) {
  return {
    property: MemoryPropertyStore.toPublicProperty(property),
    appraiser: {
      district: property.appraiser_district,
      landValue: property.land_value,
      improvementValue: property.improvement_value,
      legalDescription: property.legal_description,
      updatedAt: new Date().toISOString(),
      note: geocode?.matchedAddress
        ? `Geocoded via US Census: ${geocode.matchedAddress}`
        : 'Matched via Florida statewide cadastral service'
    },
    ownerContact: {
      name: property.owner_name,
      phone: null,
      email: null,
      mailingAddress: property.owner_mailing_address,
      source: property.contact_source
    },
    meta: {
      cached: false,
      source: property.data_source
    }
  };
}

async function lookupByAddress(input) {
  const { address, city, state, zipCode } = input;

  if (state?.toUpperCase() !== 'FL') {
    return null;
  }

  const geocode = await geocodeAddress({ address, city, state, zipCode }).catch(() => null);
  const resolvedCity = city || geocode?.city || '';
  const resolvedZip = zipCode || geocode?.zipCode || '';
  const features = await searchStatewide({
    address,
    city: resolvedCity,
    zipCode: resolvedZip,
    geocode
  });
  const best = pickBestFeature(features, { address, city: resolvedCity, zipCode: resolvedZip });

  if (!best?.attributes) {
    return null;
  }

  const property = toLiveProperty(best.attributes, geocode);
  return toLookupPayload(property, geocode);
}

module.exports = { lookupByAddress };
