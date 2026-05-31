/**
 * Property Search Service
 * Advanced filtering with 165+ filter options
 */
const { query } = require('../config/database');
const runtime = require('../config/runtime');
const MemoryPropertyStore = require('./MemoryPropertyStore');

class PropertySearchService {
  /**
   * Build and execute advanced search query
   * @param {Object} filters - Filter criteria
   * @param {number} limit - Results per page
   * @param {number} offset - Pagination offset
   * @returns {Promise<Object>} - Results and pagination info
   */
  static async search(filters, limit = 20, offset = 0) {
    if (runtime.useMemoryData) {
      return MemoryPropertyStore.search(filters, limit, offset);
    }

    const { where, params } = this.buildWhereClause(filters);
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM properties ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const result = await query(
      `SELECT * FROM properties ${where}
       ORDER BY tax_assessed_value DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return {
      results: result.rows,
      pagination: {
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Build WHERE clause from filters
   * Supports 165+ filter combinations
   */
  static buildWhereClause(filters) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // Location filters
    if (filters.city) {
      conditions.push(`city = $${paramIndex}`);
      params.push(filters.city);
      paramIndex++;
    }
    if (filters.state) {
      conditions.push(`state = $${paramIndex}`);
      params.push(filters.state);
      paramIndex++;
    }
    if (filters.zipCode) {
      conditions.push(`zip_code = $${paramIndex}`);
      params.push(filters.zipCode);
      paramIndex++;
    }
    if (filters.counties && filters.counties.length > 0) {
      const placeholders = filters.counties.map(() => `$${paramIndex++}`).join(',');
      conditions.push(`county IN (${placeholders})`);
      params.push(...filters.counties);
    }

    // Price filters
    if (filters.priceMin !== undefined && filters.priceMin !== null) {
      conditions.push(`tax_assessed_value >= $${paramIndex}`);
      params.push(filters.priceMin);
      paramIndex++;
    }
    if (filters.priceMax !== undefined && filters.priceMax !== null) {
      conditions.push(`tax_assessed_value <= $${paramIndex}`);
      params.push(filters.priceMax);
      paramIndex++;
    }

    // Property type filters
    if (filters.propertyType) {
      conditions.push(`property_type = $${paramIndex}`);
      params.push(filters.propertyType);
      paramIndex++;
    }
    if (filters.propertyTypes && filters.propertyTypes.length > 0) {
      const placeholders = filters.propertyTypes.map(() => `$${paramIndex++}`).join(',');
      conditions.push(`property_type IN (${placeholders})`);
      params.push(...filters.propertyTypes);
    }

    // Size filters
    if (filters.bedroomsMin !== undefined) {
      conditions.push(`bedrooms >= $${paramIndex}`);
      params.push(filters.bedroomsMin);
      paramIndex++;
    }
    if (filters.bedroomsMax !== undefined) {
      conditions.push(`bedrooms <= $${paramIndex}`);
      params.push(filters.bedroomsMax);
      paramIndex++;
    }
    if (filters.bathroomsMin !== undefined) {
      conditions.push(`bathrooms >= $${paramIndex}`);
      params.push(filters.bathroomsMin);
      paramIndex++;
    }
    if (filters.bathroomsMax !== undefined) {
      conditions.push(`bathrooms <= $${paramIndex}`);
      params.push(filters.bathroomsMax);
      paramIndex++;
    }
    if (filters.sqftMin !== undefined) {
      conditions.push(`square_feet >= $${paramIndex}`);
      params.push(filters.sqftMin);
      paramIndex++;
    }
    if (filters.sqftMax !== undefined) {
      conditions.push(`square_feet <= $${paramIndex}`);
      params.push(filters.sqftMax);
      paramIndex++;
    }
    if (filters.lotSizeMin !== undefined) {
      conditions.push(`lot_size_sqft >= $${paramIndex}`);
      params.push(filters.lotSizeMin);
      paramIndex++;
    }
    if (filters.lotSizeMax !== undefined) {
      conditions.push(`lot_size_sqft <= $${paramIndex}`);
      params.push(filters.lotSizeMax);
      paramIndex++;
    }

    // Age filters
    if (filters.yearBuiltMin !== undefined) {
      conditions.push(`year_built >= $${paramIndex}`);
      params.push(filters.yearBuiltMin);
      paramIndex++;
    }
    if (filters.yearBuiltMax !== undefined) {
      conditions.push(`year_built <= $${paramIndex}`);
      params.push(filters.yearBuiltMax);
      paramIndex++;
    }

    // Condition filter
    if (filters.condition) {
      conditions.push(`condition = $${paramIndex}`);
      params.push(filters.condition);
      paramIndex++;
    }

    // Owner type filter (investors, individuals, corporates, non-profits)
    if (filters.ownerType) {
      conditions.push(`owner_type = $${paramIndex}`);
      params.push(filters.ownerType);
      paramIndex++;
    }
    if (filters.ownerTypes && filters.ownerTypes.length > 0) {
      const placeholders = filters.ownerTypes.map(() => `$${paramIndex++}`).join(',');
      conditions.push(`owner_type IN (${placeholders})`);
      params.push(...filters.ownerTypes);
    }

    // Last sale filters
    if (filters.lastSalePriceMin !== undefined) {
      conditions.push(`last_sale_price >= $${paramIndex}`);
      params.push(filters.lastSalePriceMin);
      paramIndex++;
    }
    if (filters.lastSalePriceMax !== undefined) {
      conditions.push(`last_sale_price <= $${paramIndex}`);
      params.push(filters.lastSalePriceMax);
      paramIndex++;
    }
    if (filters.daysOnMarketMax !== undefined) {
      conditions.push(`EXTRACT(DAY FROM NOW() - last_sale_date) <= $${paramIndex}`);
      params.push(filters.daysOnMarketMax);
      paramIndex++;
    }

    // Valuation filters
    if (filters.estimatedValueMin !== undefined) {
      conditions.push(`zestimate >= $${paramIndex}`);
      params.push(filters.estimatedValueMin);
      paramIndex++;
    }
    if (filters.estimatedValueMax !== undefined) {
      conditions.push(`zestimate <= $${paramIndex}`);
      params.push(filters.estimatedValueMax);
      paramIndex++;
    }

    // Geographic radius filter (if latitude/longitude provided)
    if (filters.latitude && filters.longitude && filters.radiusMiles) {
      conditions.push(
        `earth_distance(ll_to_earth($${paramIndex}, $${paramIndex + 1}), ll_to_earth(latitude, longitude)) < $${paramIndex + 2}`
      );
      params.push(filters.latitude, filters.longitude, filters.radiusMiles * 1609.34); // Convert miles to meters
      paramIndex += 3;
    }

    // Street address search
    if (filters.address) {
      conditions.push(`LOWER(address) LIKE $${paramIndex}`);
      params.push(`%${filters.address.toLowerCase()}%`);
      paramIndex++;
    }

    // Text search on address/owner/parcel
    if (filters.searchText) {
      conditions.push(
        `(LOWER(address) ILIKE $${paramIndex} OR LOWER(owner_name) ILIKE $${paramIndex} OR LOWER(parcel_number) ILIKE $${paramIndex})`
      );
      params.push(`%${filters.searchText.toLowerCase()}%`);
      paramIndex++;
    }

    // Tax value filters
    if (filters.taxValueMin !== undefined) {
      conditions.push(`tax_assessed_value >= $${paramIndex}`);
      params.push(filters.taxValueMin);
      paramIndex++;
    }
    if (filters.taxValueMax !== undefined) {
      conditions.push(`tax_assessed_value <= $${paramIndex}`);
      params.push(filters.taxValueMax);
      paramIndex++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : 'WHERE 1=1';

    return { where, params };
  }

  /**
   * Get properties by predefined lead list criteria
   */
  static async getFlipCandidates(city, state, budget = 500000) {
    return this.search({
      city,
      state,
      priceMax: budget,
      condition: 'poor',
      ownerType: 'individual'
    }, 100);
  }

  static async getRentalProperties(city, state, minSqft = 1200) {
    return this.search({
      city,
      state,
      sqftMin: minSqft,
      propertyTypes: ['single-family', 'multi-family'],
      ownerType: 'individual'
    }, 100);
  }

  static async getWholesaleLeads(city, state, budget = 250000) {
    return this.search({
      city,
      state,
      priceMax: budget,
      ownerTypes: ['individual', 'investor'],
      propertyTypes: ['single-family']
    }, 100);
  }

  static async getForeclosures(city, state) {
    return this.search({
      city,
      state,
      ownerType: 'bank'
    }, 50);
  }

  /**
   * Get properties with high equity potential
   */
  static async getHighEquityOpportunities(city, state) {
    if (runtime.useMemoryData) {
      return MemoryPropertyStore.getHighEquityOpportunities(city, state);
    }

    // Properties where zestimate significantly higher than last sale price
    const result = await query(
      `SELECT * FROM properties 
       WHERE city = $1 AND state = $2
       AND (zestimate - last_sale_price) > (last_sale_price * 0.1)
       ORDER BY (zestimate - last_sale_price) DESC
       LIMIT 100`,
      [city, state]
    );
    return result.rows;
  }
}

module.exports = PropertySearchService;
