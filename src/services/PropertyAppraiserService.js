/**
 * Property lookup via county appraiser records + contact enrichment
 */
const { query } = require('../config/database');
const runtime = require('../config/runtime');
const MemoryPropertyStore = require('./MemoryPropertyStore');
const AppraiserAdapter = require('./AppraiserAdapter');
const FlArcGisParcelProvider = require('./FlArcGisParcelProvider');
const LookupCacheService = require('./LookupCacheService');
const { getLookupHint } = require('../data/demoAddresses');
const { normalizeAddress, normalizeLookupInput } = require('../utils/address');

function toPublicProperty(property) {
  return MemoryPropertyStore.toPublicProperty(property);
}

class PropertyAppraiserService {
  static async findInDatabase({ address, city, state, zipCode }) {
    if (runtime.useMemoryData) {
      const normalized = normalizeAddress(address);
      const match = MemoryPropertyStore.properties.find((property) => {
        const sameCity = !city || property.city.toLowerCase() === city.toLowerCase();
        const sameState = !state || property.state.toUpperCase() === state.toUpperCase();
        const propertyAddress = normalizeAddress(property.address);
        return sameCity && sameState && (
          propertyAddress.includes(normalized) || normalized.includes(propertyAddress)
        );
      });
      return match || null;
    }

    const normalized = normalizeAddress(address);
    const result = await query(
      `SELECT * FROM properties
       WHERE ($3::text IS NULL OR LOWER(city) = LOWER($3))
       AND ($4::text IS NULL OR UPPER(state) = UPPER($4))
       AND (
         LOWER(address) LIKE $1
         OR LOWER($2) LIKE '%' || LOWER(address) || '%'
       )
       ORDER BY
         CASE WHEN LOWER(address) = LOWER($5) THEN 0 ELSE 1 END,
         LENGTH(address)
       LIMIT 1`,
      [
        `%${normalized}%`,
        normalized,
        city || null,
        state || null,
        address
      ]
    );

    if (zipCode && result.rows.length === 0) {
      const zipResult = await query(
        `SELECT * FROM properties WHERE zip_code = $1 AND LOWER(address) LIKE $2 LIMIT 1`,
        [zipCode, `%${normalized}%`]
      );
      return zipResult.rows[0] || null;
    }

    return result.rows[0] || null;
  }

  static async findByParcel(parcelNumber) {
    if (runtime.useMemoryData) {
      return MemoryPropertyStore.properties.find((p) => p.parcel_number === parcelNumber) || null;
    }
    const result = await query('SELECT * FROM properties WHERE parcel_number = $1 LIMIT 1', [parcelNumber]);
    return result.rows[0] || null;
  }

  static mergeAppraiserData(property, appraiserRecord) {
    if (!appraiserRecord) return property;

    return {
      ...property,
      parcel_number: property?.parcel_number || appraiserRecord.parcelNumber,
      owner_mailing_address: appraiserRecord.ownerMailingAddress || property?.owner_mailing_address,
      owner_phone: appraiserRecord.ownerPhone || property?.owner_phone,
      owner_email: appraiserRecord.ownerEmail || property?.owner_email,
      appraiser_district: appraiserRecord.source || property?.appraiser_district,
      land_value: appraiserRecord.landValue ?? property?.land_value,
      improvement_value: appraiserRecord.improvementValue ?? property?.improvement_value,
      legal_description: appraiserRecord.legalDescription || property?.legal_description,
      contact_source: appraiserRecord.contactSource || property?.contact_source,
      appraiser_updated_at: appraiserRecord.appraiserUpdatedAt || property?.appraiser_updated_at,
      data_source: property?.data_source || 'county_appraiser'
    };
  }

  static async persistEnrichment(property) {
    if (runtime.useMemoryData || !property?.id) return property;

    await query(
      `UPDATE properties SET
        owner_phone = COALESCE($2, owner_phone),
        owner_email = COALESCE($3, owner_email),
        owner_mailing_address = COALESCE($4, owner_mailing_address),
        appraiser_district = COALESCE($5, appraiser_district),
        land_value = COALESCE($6, land_value),
        improvement_value = COALESCE($7, improvement_value),
        legal_description = COALESCE($8, legal_description),
        contact_source = COALESCE($9, contact_source),
        appraiser_updated_at = COALESCE($10, appraiser_updated_at),
        data_source = COALESCE($11, data_source)
       WHERE id = $1`,
      [
        property.id,
        property.owner_phone,
        property.owner_email,
        property.owner_mailing_address,
        property.appraiser_district,
        property.land_value,
        property.improvement_value,
        property.legal_description,
        property.contact_source,
        property.appraiser_updated_at,
        property.data_source
      ]
    );

    const refreshed = await query('SELECT * FROM properties WHERE id = $1', [property.id]);
    return refreshed.rows[0];
  }

  static isLiveFloridaEnabled() {
    return process.env.FL_LIVE_LOOKUP !== 'false';
  }

  static async lookupByAddress(input) {
    const normalized = normalizeLookupInput(input);
    const { address, city, state, zipCode } = normalized;

    if (!address?.trim()) {
      throw { status: 400, message: 'Street address is required' };
    }

    if (!city?.trim()) {
      throw {
        status: 400,
        message: 'City is required. Paste a full address like "100 Biscayne Boulevard, Miami, FL 33132".'
      };
    }

    const cached = await LookupCacheService.getLookupResult({ address, city, state, zipCode });
    if (cached) {
      return { ...cached, meta: { ...(cached.meta || {}), cached: true } };
    }

    if (state?.toUpperCase() === 'FL' && this.isLiveFloridaEnabled()) {
      try {
        const liveResult = await FlArcGisParcelProvider.lookupByAddress({ address, city, state, zipCode });
        if (liveResult) {
          await LookupCacheService.saveLookupResult({ address, city, state, zipCode }, liveResult);
          return liveResult;
        }
      } catch (error) {
        console.warn('Florida live lookup failed:', error.message);
      }
    }

    let property = await this.findInDatabase({ address, city, state, zipCode });
    const appraiserRecord = await AppraiserAdapter.fetchAppraiserRecord({
      address,
      city: city || property?.city,
      state: state || property?.state,
      zipCode: zipCode || property?.zip_code,
      parcelNumber: property?.parcel_number
    });

    if (!property && appraiserRecord?.parcelNumber) {
      property = await this.findByParcel(appraiserRecord.parcelNumber);
    }

    if (!property && !appraiserRecord?.landValue && !appraiserRecord?.ownerPhone) {
      const { hint, sampleAddresses } = getLookupHint(state);
      throw {
        status: 404,
        message:
          state?.toUpperCase() === 'FL'
            ? 'No Florida parcel found for that address'
            : 'No property found for that address in connected appraisal districts',
        details: {
          hint:
            state?.toUpperCase() === 'FL'
              ? `${hint} Live Florida lookups use FDOR ArcGIS on demand — try the full situs address with city.`
              : hint,
          sampleAddresses,
          state: state || null
        }
      };
    }

    property = this.mergeAppraiserData(property, appraiserRecord);

    if (property?.id && !String(property.id).startsWith('live-')) {
      property = await this.persistEnrichment(property);
    }

    const response = {
      property: toPublicProperty(property),
      appraiser: {
        district: appraiserRecord?.source || property?.appraiser_district,
        landValue: appraiserRecord?.landValue ?? property?.land_value,
        improvementValue: appraiserRecord?.improvementValue ?? property?.improvement_value,
        legalDescription: appraiserRecord?.legalDescription || property?.legal_description,
        updatedAt: appraiserRecord?.appraiserUpdatedAt,
        note: appraiserRecord?.note
      },
      ownerContact: {
        name: property.owner_name,
        phone: property.owner_phone,
        email: property.owner_email,
        mailingAddress: property.owner_mailing_address,
        source: property.contact_source
      },
      meta: {
        cached: false,
        source: property.data_source || 'county_appraiser'
      }
    };

    await LookupCacheService.saveLookupResult({ address, city, state, zipCode }, response);
    return response;
  }
}

module.exports = PropertyAppraiserService;
