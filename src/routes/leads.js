/**
 * Lead Management API Routes
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const LeadList = require('../models/LeadList');
const PropertySearchService = require('../services/PropertySearchService');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const lists = await LeadList.findByUser(req.user.id);
    res.json({
      success: true,
      leads: lists.map((list) => ({
        id: list.id,
        name: list.name,
        description: list.description,
        listType: list.list_type,
        criteria: list.criteria,
        propertyCount: list.property_count,
        createdAt: list.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, listType, description, criteria = {}, city, state } = req.body;

    if (!name || !city || !state) {
      throw { status: 400, message: 'name, city, and state are required' };
    }

    const searchCriteria = { ...criteria, city, state };
    const searchResults = await PropertySearchService.search(searchCriteria, 100);

    const list = await LeadList.create(req.user.id, {
      name,
      description: description || null,
      listType: listType || 'custom',
      criteria: searchCriteria
    });

    for (const property of searchResults.results) {
      await LeadList.addItem(list.id, property.id, null, null, null);
    }

    res.status(201).json({
      success: true,
      message: 'Lead list saved',
      lead: {
        id: list.id,
        name: list.name,
        listType: list.list_type,
        propertyCount: searchResults.results.length
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const list = await LeadList.findById(req.params.id);

    if (!list || list.user_id !== req.user.id) {
      throw { status: 404, message: 'Lead list not found' };
    }

    const items = await LeadList.getItems(list.id);

    res.json({
      success: true,
      lead: {
        id: list.id,
        name: list.name,
        description: list.description,
        listType: list.list_type,
        criteria: list.criteria,
        createdAt: list.created_at,
        properties: items.map((item) => ({
          id: item.property_id,
          address: item.address,
          city: item.city,
          state: item.state,
          tax_assessed_value: item.tax_assessed_value,
          score: item.score
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await LeadList.delete(req.params.id, req.user.id);

    if (!deleted) {
      throw { status: 404, message: 'Lead list not found' };
    }

    res.json({ success: true, message: 'Lead list deleted' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/export', async (req, res, next) => {
  try {
    const list = await LeadList.findById(req.params.id);

    if (!list || list.user_id !== req.user.id) {
      throw { status: 404, message: 'Lead list not found' };
    }

    const items = await LeadList.getItems(list.id);
    const header = 'address,city,state,tax_assessed_value\n';
    const rows = items.map((item) =>
      `"${item.address}","${item.city}","${item.state}",${item.tax_assessed_value || ''}`
    );
    const csv = header + rows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leads-${list.id}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
