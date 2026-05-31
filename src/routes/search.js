/**
 * Search API Routes
 * POST /api/search - Advanced property search with filters
 * POST /api/search/leads - Generate predefined lead list
 * GET /api/search/templates - Get lead list templates
 */
const express = require('express');
const router = express.Router();
const PropertySearchService = require('../services/PropertySearchService');
const PropertyAppraiserService = require('../services/PropertyAppraiserService');
const LeadList = require('../models/LeadList');
const { validateSearch, validateLeadList } = require('../utils/validation');

/**
 * Lookup property by street address + appraiser records
 * POST /api/search/address
 * Body: { address, city, state, zipCode }
 */
router.post('/address', async (req, res, next) => {
  try {
    const result = await PropertyAppraiserService.lookupByAddress(req.body);
    res.json({
      success: true,
      message: 'Property found via county appraiser lookup',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Advanced property search with filters
 * POST /api/search
 * Body: {city, state, priceMin, priceMax, propertyType, ...filters}
 */
router.post('/', async (req, res, next) => {
  try {
    const filters = validateSearch(req.body);
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const results = await PropertySearchService.search(filters, limit, offset);

    res.json({
      success: true,
      message: 'Property search completed',
      data: results.results,
      pagination: results.pagination
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get predefined lead list templates
 * GET /api/search/templates
 */
router.get('/templates', (req, res) => {
  const templates = [
    {
      id: 'flip-candidates',
      name: 'Fix & Flip Candidates',
      description: 'Properties needing repair with good ROI potential',
      criteria: {
        condition: 'poor',
        ownerType: 'individual',
        priceMax: 500000,
        propertyType: 'single-family'
      }
    },
    {
      id: 'rental-holds',
      name: 'Rental Hold Properties',
      description: 'Properties suitable for long-term rental income',
      criteria: {
        propertyTypes: ['single-family', 'multi-family'],
        sqftMin: 1200,
        bedroomsMin: 2
      }
    },
    {
      id: 'wholesalers',
      name: 'Wholesale Deals',
      description: 'Undervalued properties for quick deals',
      criteria: {
        ownerTypes: ['individual', 'investor'],
        priceMax: 250000,
        propertyType: 'single-family'
      }
    },
    {
      id: 'foreclosures',
      name: 'Foreclosures',
      description: 'Bank-owned properties and foreclosures',
      criteria: {
        ownerType: 'bank'
      }
    },
    {
      id: 'high-equity',
      name: 'High Equity Opportunities',
      description: 'Properties with significant equity buildup',
      criteria: {
        yearBuiltMax: 2000
      }
    }
  ];

  res.json({
    success: true,
    message: 'Lead list templates',
    templates
  });
});

/**
 * Generate lead list with predefined or custom criteria
 * POST /api/search/leads
 * Body: {listName, listType, criteria, userId}
 */
router.post('/leads', async (req, res, next) => {
  try {
    const { listName, listType, criteria, userId } = req.body;
    
    validateLeadList({
      name: listName,
      listType,
      criteria
    });

    // Fetch properties matching criteria
    const searchResults = await PropertySearchService.search(criteria, 1000);
    
    // For now, return results. Later will save to database
    res.status(201).json({
      success: true,
      message: 'Lead list generated',
      list: {
        name: listName,
        type: listType,
        propertyCount: searchResults.pagination.total,
        properties: searchResults.results.slice(0, 50) // Return first 50
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get specific lead list templates (e.g., flip candidates)
 * GET /api/search/leads/:type?city=Austin&state=TX
 */
router.get('/leads/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    const { city, state, limit = 50 } = req.query;

    let results;
    switch (type) {
      case 'flip-candidates':
        results = await PropertySearchService.getFlipCandidates(city, state);
        break;
      case 'rental-holds':
        results = await PropertySearchService.getRentalProperties(city, state);
        break;
      case 'wholesalers':
        results = await PropertySearchService.getWholesaleLeads(city, state);
        break;
      case 'foreclosures':
        results = await PropertySearchService.getForeclosures(city, state);
        break;
      case 'high-equity':
        results = await PropertySearchService.getHighEquityOpportunities(city, state);
        break;
      default:
        throw {
          status: 400,
          message: `Unknown lead list type: ${type}`
        };
    }

    res.json({
      success: true,
      message: `${type} lead list`,
      type,
      data: results.results || results,
      count: (results.results || results).length
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
