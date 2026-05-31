/**
 * Properties API Routes
 * GET /api/properties/:id - Get property details
 * GET /api/properties - List properties with pagination
 */
const express = require('express');
const router = express.Router();
const runtime = require('../config/runtime');
const MemoryPropertyStore = require('../services/MemoryPropertyStore');
const LookupCacheService = require('../services/LookupCacheService');
const Property = require('../models/Property');

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id.startsWith('live-')) {
      const cached = await LookupCacheService.getByLiveId(id);
      if (cached?.property) {
        return res.json({
          success: true,
          data: { property: cached.property, appraiser: cached.appraiser, ownerContact: cached.ownerContact }
        });
      }
      return res.status(404).json({ error: 'Property not found', message: 'Live lookup expired — search the address again.' });
    }

    if (runtime.useMemoryData) {
      const property = MemoryPropertyStore.findById(id);
      if (!property) {
        return res.status(404).json({ error: 'Property not found', message: 'Property not found' });
      }

      return res.json({
        success: true,
        data: { property: MemoryPropertyStore.toPublicProperty(property) }
      });
    }

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found', message: 'Property not found' });
    }

    res.json({
      success: true,
      data: { property: MemoryPropertyStore.toPublicProperty(property) }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    if (runtime.useMemoryData) {
      const results = MemoryPropertyStore.search({}, limit, offset);
      return res.json({
        success: true,
        data: results.results.map(MemoryPropertyStore.toPublicProperty),
        pagination: results.pagination
      });
    }

    res.json({
      success: true,
      page,
      limit,
      data: []
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
