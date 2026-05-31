/**
 * In-memory property store for local development when PostgreSQL is unavailable
 */
const { v4: uuid } = require('uuid');
const { sampleProperties } = require('../db/seed');
const appraiserCatalog = require('../data/appraiserCatalog');

function toDbRow(prop) {
  return {
    id: prop.id || uuid(),
    parcel_number: prop.parcelNumber,
    address: prop.address,
    city: prop.city,
    state: prop.state,
    zip_code: prop.zipCode,
    property_type: prop.propertyType,
    bedrooms: prop.bedrooms,
    bathrooms: prop.bathrooms,
    square_feet: prop.squareFeet,
    lot_size_sqft: prop.lotSizeSqft,
    year_built: prop.yearBuilt,
    condition: prop.condition,
    tax_assessed_value: prop.taxAssessedValue,
    zestimate: prop.zestimate,
    last_sale_price: prop.lastSalePrice,
    last_sale_date: prop.lastSaleDate,
    owner_name: prop.ownerName,
    owner_type: prop.ownerType,
    latitude: prop.latitude,
    longitude: prop.longitude,
    data_source: prop.dataSource
  };
}

const properties = sampleProperties.map(toDbRow);

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function matchesFilters(property, filters) {
  if (filters.city && property.city.toLowerCase() !== filters.city.toLowerCase()) return false;
  if (filters.state && property.state.toUpperCase() !== filters.state.toUpperCase()) return false;
  if (filters.zipCode && property.zip_code !== filters.zipCode) return false;
  if (filters.priceMin != null && property.tax_assessed_value < filters.priceMin) return false;
  if (filters.priceMax != null && property.tax_assessed_value > filters.priceMax) return false;
  if (filters.propertyType && property.property_type !== filters.propertyType) return false;
  if (filters.propertyTypes?.length && !filters.propertyTypes.includes(property.property_type)) return false;
  if (filters.bedroomsMin != null && property.bedrooms < filters.bedroomsMin) return false;
  if (filters.bedroomsMax != null && property.bedrooms > filters.bedroomsMax) return false;
  if (filters.bathroomsMin != null && property.bathrooms < filters.bathroomsMin) return false;
  if (filters.bathroomsMax != null && property.bathrooms > filters.bathroomsMax) return false;
  if (filters.sqftMin != null && property.square_feet < filters.sqftMin) return false;
  if (filters.sqftMax != null && property.square_feet > filters.sqftMax) return false;
  if (filters.condition && property.condition !== filters.condition) return false;
  if (filters.ownerType && property.owner_type !== filters.ownerType) return false;
  if (filters.ownerTypes?.length && !filters.ownerTypes.includes(property.owner_type)) return false;
  if (filters.searchText) {
    const text = filters.searchText.toLowerCase();
    const haystack = `${property.address} ${property.owner_name}`.toLowerCase();
    if (!haystack.includes(text)) return false;
  }
  return true;
}

function search(filters, limit = 20, offset = 0) {
  const filtered = properties
    .filter((property) => matchesFilters(property, filters))
    .sort((a, b) => b.tax_assessed_value - a.tax_assessed_value);

  const total = filtered.length;
  const results = filtered.slice(offset, offset + limit);

  return {
    results,
    pagination: {
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  };
}

function findById(id) {
  return properties.find((property) => property.id === id) || null;
}

function findComps(propertyId, options = {}) {
  const {
    radius = 0.5,
    bedrooms = null,
    bathrooms = null,
    sqft = null,
    maxComps = 10
  } = options;

  const targetProperty = findById(propertyId);
  if (!targetProperty) {
    throw { status: 404, message: 'Property not found' };
  }

  const searchBedrooms = bedrooms ?? targetProperty.bedrooms ?? 0;
  const searchBathrooms = bathrooms ?? targetProperty.bathrooms ?? 0;
  const searchSqft = sqft ?? targetProperty.square_feet ?? 0;

  const comps = properties
    .filter((property) => {
      if (property.id === propertyId) return false;
      if (property.state !== targetProperty.state) return false;
      if (property.property_type !== targetProperty.property_type) return false;
      if (property.last_sale_price == null) return false;
      if (Math.abs(property.bedrooms - searchBedrooms) > 1) return false;
      if (Math.abs(property.bathrooms - searchBathrooms) > 1) return false;

      const distance = haversineMeters(
        targetProperty.latitude,
        targetProperty.longitude,
        property.latitude,
        property.longitude
      );
      return distance <= radius * 1609.34;
    })
    .map((property) => {
      const distance_meters = haversineMeters(
        targetProperty.latitude,
        targetProperty.longitude,
        property.latitude,
        property.longitude
      );
      const similarity_score =
        Math.abs(property.bedrooms - searchBedrooms) * 0.2 +
        Math.abs(property.bathrooms - searchBathrooms) * 0.2 +
        Math.abs(property.square_feet - searchSqft) / Math.max(searchSqft, 1) * 0.3 +
        Math.abs(property.tax_assessed_value - targetProperty.tax_assessed_value) /
          Math.max(targetProperty.tax_assessed_value, 1) *
          0.3;

      return { ...property, distance_meters, similarity_score };
    })
    .sort((a, b) => a.similarity_score - b.similarity_score)
    .slice(0, maxComps);

  return { targetProperty, comps, count: comps.length };
}

function getMarketTrends(city, state, propertyType = null) {
  const grouped = new Map();

  for (const property of properties) {
    if (property.city.toLowerCase() !== city.toLowerCase()) continue;
    if (property.state.toUpperCase() !== state.toUpperCase()) continue;
    if (propertyType && property.property_type !== propertyType) continue;

    const key = property.property_type;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(property);
  }

  return [...grouped.entries()].map(([type, rows]) => {
    const avg = (field) => rows.reduce((sum, row) => sum + (row[field] || 0), 0) / rows.length;
    const prices = rows.map((row) => row.tax_assessed_value);
    const sqftPrices = rows.filter((row) => row.square_feet > 0 && row.last_sale_price);

    return {
      propertyType: type,
      totalProperties: rows.length,
      avgPrice: Math.round(avg('tax_assessed_value')),
      avgSoldPrice: Math.round(avg('last_sale_price')),
      avgSqft: Math.round(avg('square_feet')),
      avgPricePerSqft:
        sqftPrices.length > 0
          ? Math.round(
              (sqftPrices.reduce((sum, row) => sum + row.last_sale_price / row.square_feet, 0) /
                sqftPrices.length) *
                100
            ) / 100
          : 0,
      priceRange: {
        min: Math.round(Math.min(...prices)),
        max: Math.round(Math.max(...prices))
      },
      avgYearBuilt: Math.round(avg('year_built'))
    };
  });
}

function getHighEquityOpportunities(city, state) {
  return properties.filter((property) => {
    if (property.city.toLowerCase() !== city.toLowerCase()) return false;
    if (property.state.toUpperCase() !== state.toUpperCase()) return false;
    return property.zestimate - property.last_sale_price > property.last_sale_price * 0.1;
  });
}

function toPublicProperty(property) {
  const catalog = appraiserCatalog[property.parcel_number] || {};
  return {
    id: property.id,
    address: property.address,
    city: property.city,
    state: property.state,
    zip_code: property.zip_code,
    price: property.tax_assessed_value,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    square_feet: property.square_feet,
    property_type: property.property_type,
    owner_name: property.owner_name,
    owner_phone: property.owner_phone || catalog.ownerPhone,
    owner_email: property.owner_email || catalog.ownerEmail,
    owner_mailing_address: property.owner_mailing_address || catalog.ownerMailingAddress,
    appraiser_district: property.appraiser_district || catalog.appraiserDistrict,
    land_value: property.land_value ?? catalog.landValue,
    improvement_value: property.improvement_value ?? catalog.improvementValue,
    legal_description: property.legal_description || catalog.legalDescription,
    contact_source: property.contact_source || catalog.contactSource,
    parcel_number: property.parcel_number,
    year_built: property.year_built,
    tax_value: property.tax_assessed_value,
    condition: property.condition,
    zestimate: property.zestimate,
    last_sale_price: property.last_sale_price
  };
}

module.exports = {
  properties,
  search,
  findById,
  findComps,
  getMarketTrends,
  getHighEquityOpportunities,
  toPublicProperty
};
