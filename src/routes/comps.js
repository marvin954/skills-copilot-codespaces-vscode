/**
 * Comps API Routes
 * GET /api/comps/:propertyId - Find comparable properties
 * GET /api/comps/market/trends - Get market trends
 * GET /api/comps/appreciation - Get price appreciation
 */
const express = require('express');
const router = express.Router();
const CompsService = require('../services/CompsService');

/**
 * Get market trends for a city
 * GET /api/comps/market/trends?city=Austin&state=TX
 */
router.get('/market/trends', async (req, res, next) => {
  try {
    const { city, state, propertyType } = req.query;

    if (!city || !state) {
      throw {
        status: 400,
        message: 'city and state are required'
      };
    }

    const trends = await CompsService.getMarketTrends(city, state, propertyType);

    res.json({
      success: true,
      message: 'Market trends',
      city,
      state,
      propertyType: propertyType || 'all',
      data: trends
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get price appreciation estimate
 * GET /api/comps/appreciation?city=Austin&state=TX&years=5
 */
router.get('/appreciation', async (req, res, next) => {
  try {
    const { city, state, years = 5 } = req.query;

    if (!city || !state) {
      throw {
        status: 400,
        message: 'city and state are required'
      };
    }

    const appreciation = await CompsService.getPriceAppreciation(city, state, parseInt(years));

    if (!appreciation) {
      return res.json({
        success: false,
        message: 'Insufficient data for appreciation calculation'
      });
    }

    res.json({
      success: true,
      message: 'Price appreciation estimate',
      data: appreciation
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get comparable properties for a property
 * GET /api/comps/:propertyId?radius=0.5&bedrooms=3&bathrooms=2
 */
router.get('/:propertyId', async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { radius = 0.5, bedrooms, bathrooms, sqft, maxComps = 10 } = req.query;

    const compsData = await CompsService.findComps(propertyId, {
      radius: parseFloat(radius),
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseFloat(bathrooms) : null,
      sqft: sqft ? parseInt(sqft) : null,
      maxComps: parseInt(maxComps)
    });

    res.json({
      success: true,
      message: 'Comparable properties found',
      data: {
        targetProperty: compsData.targetProperty,
        comps: compsData.comps.map(comp => ({
          id: comp.id,
          address: comp.address,
          city: comp.city,
          state: comp.state,
          price: comp.last_sale_price,
          saleDate: comp.last_sale_date,
          bedrooms: comp.bedrooms,
          bathrooms: comp.bathrooms,
          sqft: comp.square_feet,
          pricePerSqft: comp.square_feet ? Math.round((comp.last_sale_price / comp.square_feet) * 100) / 100 : 0,
          distanceMiles: Math.round(comp.distance_meters / 1609.34 * 100) / 100,
          similarityScore: Math.round(comp.similarity_score * 100) / 100
        })),
        metrics: compsData.metrics,
        count: compsData.count
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
