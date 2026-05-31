/**
 * Property model
 */
const { query } = require('../config/database');

class Property {
  static async findById(id) {
    const result = await query(
      'SELECT * FROM properties WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByAddress(address, city, state) {
    const result = await query(
      'SELECT * FROM properties WHERE address = $1 AND city = $2 AND state = $3',
      [address, city, state]
    );
    return result.rows[0];
  }

  static async search(filters, limit = 20, offset = 0) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (filters.city) {
      whereClause += ` AND city = $${params.length + 1}`;
      params.push(filters.city);
    }
    if (filters.state) {
      whereClause += ` AND state = $${params.length + 1}`;
      params.push(filters.state);
    }
    if (filters.priceMin) {
      whereClause += ` AND tax_assessed_value >= $${params.length + 1}`;
      params.push(filters.priceMin);
    }
    if (filters.priceMax) {
      whereClause += ` AND tax_assessed_value <= $${params.length + 1}`;
      params.push(filters.priceMax);
    }
    if (filters.propertyType) {
      whereClause += ` AND property_type = $${params.length + 1}`;
      params.push(filters.propertyType);
    }

    const result = await query(
      `SELECT * FROM properties ${whereClause} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    return result.rows;
  }

  static async create(propertyData) {
    const {
      parcelNumber, address, city, state, zipCode, propertyType,
      bedrooms, bathrooms, squareFeet, yearBuilt, taxValue,
      ownerName, latitude, longitude
    } = propertyData;

    const result = await query(
      `INSERT INTO properties (
        parcel_number, address, city, state, zip_code, property_type,
        bedrooms, bathrooms, square_feet, year_built, tax_assessed_value,
        owner_name, latitude, longitude, data_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [parcelNumber, address, city, state, zipCode, propertyType,
       bedrooms, bathrooms, squareFeet, yearBuilt, taxValue,
       ownerName, latitude, longitude, 'manual']
    );
    return result.rows[0];
  }
}

module.exports = Property;
