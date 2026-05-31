/**
 * Comps Analysis Service
 * Find comparable properties and calculate market metrics
 */
const { query } = require('../config/database');
const runtime = require('../config/runtime');
const MemoryPropertyStore = require('./MemoryPropertyStore');

class CompsService {
  /**
   * Find comparable properties for a given property
   * @param {string} propertyId - Property ID
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Comparable properties and metrics
   */
  static async findComps(propertyId, options = {}) {
    if (runtime.useMemoryData) {
      const compsData = MemoryPropertyStore.findComps(propertyId, options);
      const metrics = this.calculateMetrics(compsData.targetProperty, compsData.comps);
      return { ...compsData, metrics };
    }

    const {
      radius = 0.5, // miles
      bedrooms = null,
      bathrooms = null,
      sqft = null,
      maxComps = 10
    } = options;

    // Get the target property
    const targetResult = await query(
      'SELECT * FROM properties WHERE id = $1',
      [propertyId]
    );

    if (targetResult.rows.length === 0) {
      throw {
        status: 404,
        message: 'Property not found'
      };
    }

    const targetProperty = targetResult.rows[0];

    // Build comps search criteria
    const searchBedrooms = bedrooms || targetProperty.bedrooms || 0;
    const searchBathrooms = bathrooms || targetProperty.bathrooms || 0;
    const searchSqft = sqft || targetProperty.square_feet || 0;

    // Find comparable properties within radius
    // Must be similar in key characteristics
    const compsResult = await query(
      `SELECT p.*,
              earth_distance(
                ll_to_earth($1, $2),
                ll_to_earth(p.latitude, p.longitude)
              ) as distance_meters,
              ABS(p.bedrooms - $3) as bed_diff,
              ABS(p.bathrooms - $4) as bath_diff,
              ABS(p.square_feet - $5) as sqft_diff,
              ABS(p.tax_assessed_value - $6) as price_diff,
              (
                ABS(p.bedrooms - $3) * 0.2 +
                ABS(p.bathrooms - $4) * 0.2 +
                ABS(CAST(p.square_feet AS FLOAT) - $5) / NULLIF($5, 0) * 0.3 +
                ABS(CAST(p.tax_assessed_value AS FLOAT) - $6) / NULLIF($6, 0) * 0.3
              ) as similarity_score
       FROM properties p
       WHERE p.id != $7
       AND p.state = $8
       AND p.property_type = $9
       AND earth_distance(
         ll_to_earth($1, $2),
         ll_to_earth(p.latitude, p.longitude)
       ) < $10
       AND ABS(p.bedrooms - $3) <= 1
       AND ABS(p.bathrooms - $4) <= 1
       AND last_sale_price IS NOT NULL
       ORDER BY similarity_score ASC
       LIMIT $11`,
      [
        targetProperty.latitude,
        targetProperty.longitude,
        searchBedrooms,
        searchBathrooms,
        searchSqft,
        targetProperty.tax_assessed_value,
        propertyId,
        targetProperty.state,
        targetProperty.property_type,
        radius * 1609.34, // Convert miles to meters
        maxComps
      ]
    );

    const comps = compsResult.rows;

    // Calculate market metrics
    const metrics = this.calculateMetrics(targetProperty, comps);

    return {
      targetProperty,
      comps,
      metrics,
      count: comps.length
    };
  }

  /**
   * Calculate market metrics from comparable properties
   */
  static calculateMetrics(targetProperty, comps) {
    if (comps.length === 0) {
      return {
        medianPrice: targetProperty.tax_assessed_value,
        avgPrice: targetProperty.tax_assessed_value,
        pricePerSqft: 0,
        daysOnMarketAvg: 0,
        priceRange: {
          min: targetProperty.tax_assessed_value,
          max: targetProperty.tax_assessed_value
        }
      };
    }

    const prices = comps.map(c => c.last_sale_price).filter(p => p !== null);
    const sqftValues = comps.map(c => c.square_feet).filter(s => s !== null && s > 0);

    // Calculate price per sqft
    let totalPricePerSqft = 0;
    let validCompsForSqft = 0;
    comps.forEach(comp => {
      if (comp.square_feet && comp.square_feet > 0 && comp.last_sale_price) {
        totalPricePerSqft += comp.last_sale_price / comp.square_feet;
        validCompsForSqft++;
      }
    });

    const avgPricePerSqft = validCompsForSqft > 0 ? totalPricePerSqft / validCompsForSqft : 0;

    // Sort prices for median
    prices.sort((a, b) => a - b);
    const medianPrice = prices.length % 2 === 0
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)];

    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b) / prices.length : 0;

    // Estimate target property value based on comps
    let estimatedValue = targetProperty.tax_assessed_value;
    if (targetProperty.square_feet && targetProperty.square_feet > 0 && avgPricePerSqft > 0) {
      estimatedValue = targetProperty.square_feet * avgPricePerSqft;
    }

    return {
      medianPrice: Math.round(medianPrice),
      avgPrice: Math.round(avgPrice),
      pricePerSqft: Math.round(avgPricePerSqft * 100) / 100,
      daysOnMarketAvg: 30, // Placeholder, would need more data
      priceRange: {
        min: Math.round(Math.min(...prices)),
        max: Math.round(Math.max(...prices))
      },
      estimatedValue: Math.round(estimatedValue),
      priceDeviation: {
        fromMedian: Math.round(targetProperty.tax_assessed_value - medianPrice),
        percentFromMedian: Math.round(((targetProperty.tax_assessed_value - medianPrice) / medianPrice) * 1000) / 10
      }
    };
  }

  /**
   * Get market trends for a city/state
   */
  static async getMarketTrends(city, state, propertyType = null) {
    if (runtime.useMemoryData) {
      return MemoryPropertyStore.getMarketTrends(city, state, propertyType);
    }

    let query_str = `
      SELECT 
        property_type,
        COUNT(*) as total_properties,
        AVG(tax_assessed_value) as avg_price,
        AVG(last_sale_price) as avg_sold_price,
        AVG(square_feet) as avg_sqft,
        AVG(CASE WHEN square_feet > 0 THEN last_sale_price / square_feet ELSE 0 END) as avg_price_per_sqft,
        MIN(tax_assessed_value) as min_price,
        MAX(tax_assessed_value) as max_price,
        AVG(year_built) as avg_year_built
      FROM properties
      WHERE city = $1 AND state = $2
    `;
    
    const params = [city, state];

    if (propertyType) {
      query_str += ` AND property_type = $3`;
      params.push(propertyType);
    }

    query_str += ` GROUP BY property_type`;

    const result = await query(query_str, params);
    
    return result.rows.map(row => ({
      propertyType: row.property_type,
      totalProperties: parseInt(row.total_properties),
      avgPrice: Math.round(row.avg_price),
      avgSoldPrice: Math.round(row.avg_sold_price),
      avgSqft: Math.round(row.avg_sqft),
      avgPricePerSqft: Math.round(row.avg_price_per_sqft * 100) / 100,
      priceRange: {
        min: Math.round(row.min_price),
        max: Math.round(row.max_price)
      },
      avgYearBuilt: Math.round(row.avg_year_built)
    }));
  }

  /**
   * Get price appreciation estimate
   */
  static async getPriceAppreciation(city, state, years = 5) {
    if (runtime.useMemoryData) {
      const cutoff = new Date().getFullYear() - years;
      const rows = MemoryPropertyStore.properties.filter(
        (property) =>
          property.city.toLowerCase() === city.toLowerCase() &&
          property.state.toUpperCase() === state.toUpperCase()
      );

      const oldPrices = rows.filter((row) => row.year_built < cutoff).map((row) => row.tax_assessed_value);
      const newPrices = rows.filter((row) => row.year_built >= cutoff).map((row) => row.tax_assessed_value);

      if (!oldPrices.length || !newPrices.length) return null;

      const avgOldPrice = oldPrices.reduce((a, b) => a + b, 0) / oldPrices.length;
      const avgNewPrice = newPrices.reduce((a, b) => a + b, 0) / newPrices.length;
      const appreciation = ((avgNewPrice - avgOldPrice) / avgOldPrice) * 100;

      return {
        periodYears: years,
        avgOldPrice: Math.round(avgOldPrice),
        avgNewPrice: Math.round(avgNewPrice),
        appreciationPercent: Math.round(appreciation * 100) / 100,
        annualAppreciation: Math.round((appreciation / years) * 100) / 100
      };
    }

    // Simplified: would need historical data
    // For now, return comparison of old vs new properties
    const result = await query(
      `SELECT 
        AVG(CASE WHEN year_built < $3 THEN tax_assessed_value ELSE NULL END) as avg_old_price,
        AVG(CASE WHEN year_built >= $3 THEN tax_assessed_value ELSE NULL END) as avg_new_price
      FROM properties
      WHERE city = $1 AND state = $2`,
      [city, state, new Date().getFullYear() - years]
    );

    const row = result.rows[0];
    if (!row.avg_old_price || !row.avg_new_price) {
      return null;
    }

    const appreciation = ((row.avg_new_price - row.avg_old_price) / row.avg_old_price) * 100;

    return {
      periodYears: years,
      avgOldPrice: Math.round(row.avg_old_price),
      avgNewPrice: Math.round(row.avg_new_price),
      appreciationPercent: Math.round(appreciation * 100) / 100,
      annualAppreciation: Math.round((appreciation / years) * 100) / 100
    };
  }
}

module.exports = CompsService;
