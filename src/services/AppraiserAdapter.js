/**
 * County appraisal district adapters
 */
const appraiserCatalog = require('../data/appraiserCatalog');
const { sampleProperties } = require('../db/seed');
const { normalizeAddress } = require('../utils/address');

const addressIndex = Object.fromEntries(
  sampleProperties.map((property) => [normalizeAddress(property.address), property.parcelNumber])
);

const DISTRICT_BY_CITY = {
  austin: 'Travis Central Appraisal District (TCAD)',
  dallas: 'Dallas Central Appraisal District (DCAD)',
  houston: 'Harris County Appraisal District (HCAD)',
  miami: 'Miami-Dade County Property Appraiser (MDCPA)',
  tampa: 'Hillsborough County Property Appraiser (HCPA)',
  orlando: 'Orange County Property Appraiser (OCPA)'
};

function getDistrict(city) {
  return DISTRICT_BY_CITY[city?.toLowerCase()] || 'County Appraisal District';
}

function findCatalogMatch({ address, city, parcelNumber }) {
  if (parcelNumber && appraiserCatalog[parcelNumber]) {
    return { ...appraiserCatalog[parcelNumber], parcelNumber };
  }

  const normalized = normalizeAddress(address);
  const matchedParcel = addressIndex[normalized];
  if (matchedParcel && appraiserCatalog[matchedParcel]) {
    return { ...appraiserCatalog[matchedParcel], parcelNumber: matchedParcel };
  }

  for (const [parcel, record] of Object.entries(appraiserCatalog)) {
    const recordStreet = normalizeAddress(record.ownerMailingAddress.split(',')[0]);
    if (normalized.includes(recordStreet) || recordStreet.includes(normalized)) {
      return { ...record, parcelNumber: parcel };
    }
  }

  return null;
}

async function fetchAppraiserRecord({ address, city, state, zipCode, parcelNumber }) {
  const catalogMatch = findCatalogMatch({ address, city, parcelNumber });

  if (catalogMatch) {
    return {
      source: getDistrict(city),
      parcelNumber: catalogMatch.parcelNumber || parcelNumber,
      landValue: catalogMatch.landValue,
      improvementValue: catalogMatch.improvementValue,
      legalDescription: catalogMatch.legalDescription,
      ownerMailingAddress: catalogMatch.ownerMailingAddress,
      ownerPhone: catalogMatch.ownerPhone,
      ownerEmail: catalogMatch.ownerEmail,
      contactSource: catalogMatch.contactSource,
      appraiserUpdatedAt: new Date().toISOString()
    };
  }

  if (!city || !state) {
    return null;
  }

  return {
    source: getDistrict(city),
    parcelNumber: parcelNumber || null,
    landValue: null,
    improvementValue: null,
    legalDescription: null,
    ownerMailingAddress: null,
    ownerPhone: null,
    ownerEmail: null,
    contactSource: 'appraiser lookup — no public contact on record',
    appraiserUpdatedAt: new Date().toISOString(),
    note: 'Parcel not found in connected appraisal districts. Try a full street address with city and state.'
  };
}

module.exports = { fetchAppraiserRecord, getDistrict };
