/**
 * Lead List model
 */
const { query } = require('../config/database');
const { v4: uuid } = require('uuid');

class LeadList {
  static async create(userId, { name, description, listType, criteria }) {
    const id = uuid();
    const result = await query(
      `INSERT INTO lead_lists (id, user_id, name, description, list_type, criteria)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, userId, name, description, listType, JSON.stringify(criteria)]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM lead_lists WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByUser(userId, limit = 50) {
    const result = await query(
      `SELECT ll.*, COUNT(lli.id)::int AS property_count
       FROM lead_lists ll
       LEFT JOIN lead_list_items lli ON lli.lead_list_id = ll.id
       WHERE ll.user_id = $1
       GROUP BY ll.id
       ORDER BY ll.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  static async delete(id, userId) {
    const result = await query(
      'DELETE FROM lead_lists WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0];
  }

  static async addItem(leadListId, propertyId, score, roi, cashflow) {
    const result = await query(
      `INSERT INTO lead_list_items (lead_list_id, property_id, score, roi_estimate, cash_flow_estimate)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [leadListId, propertyId, score, roi, cashflow]
    );
    return result.rows[0];
  }

  static async getItems(leadListId, limit = 100) {
    const result = await query(
      `SELECT lli.*, p.address, p.city, p.state, p.tax_assessed_value
       FROM lead_list_items lli
       JOIN properties p ON lli.property_id = p.id
       WHERE lli.lead_list_id = $1
       ORDER BY lli.score DESC
       LIMIT $2`,
      [leadListId, limit]
    );
    return result.rows;
  }
}

module.exports = LeadList;
