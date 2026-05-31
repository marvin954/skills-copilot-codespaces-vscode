/**
 * Input validation schemas using Joi
 */
const Joi = require('joi');

const searchValidationSchema = Joi.object({
  // Location
  city: Joi.string().max(100),
  state: Joi.string().length(2).uppercase(),
  zipCode: Joi.string().regex(/^\d{5}(-\d{4})?$/),
  counties: Joi.array().items(Joi.string()),

  // Price range
  priceMin: Joi.number().min(0),
  priceMax: Joi.number().min(0),

  // Property type
  propertyType: Joi.string().valid('single-family', 'multi-family', 'commercial', 'vacant-land', 'industrial'),
  propertyTypes: Joi.array().items(Joi.string().valid('single-family', 'multi-family', 'commercial', 'vacant-land', 'industrial')),

  // Size filters
  bedroomsMin: Joi.number().integer().min(0),
  bedroomsMax: Joi.number().integer().min(0),
  bathroomsMin: Joi.number().min(0),
  bathroomsMax: Joi.number().min(0),
  sqftMin: Joi.number().integer().min(0),
  sqftMax: Joi.number().integer().min(0),
  lotSizeMin: Joi.number().integer().min(0),
  lotSizeMax: Joi.number().integer().min(0),

  // Age
  yearBuiltMin: Joi.number().integer().min(1800),
  yearBuiltMax: Joi.number().integer().max(new Date().getFullYear()),

  // Condition
  condition: Joi.string().valid('excellent', 'good', 'fair', 'poor'),

  // Owner type
  ownerType: Joi.string().valid('individual', 'investor', 'corporation', 'non-profit', 'bank', 'government'),
  ownerTypes: Joi.array().items(Joi.string().valid('individual', 'investor', 'corporation', 'non-profit', 'bank', 'government')),

  // Last sale
  lastSalePriceMin: Joi.number().min(0),
  lastSalePriceMax: Joi.number().min(0),
  daysOnMarketMax: Joi.number().integer().min(0),

  // Valuation
  estimatedValueMin: Joi.number().min(0),
  estimatedValueMax: Joi.number().min(0),
  taxValueMin: Joi.number().min(0),
  taxValueMax: Joi.number().min(0),

  // Geographic
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  radiusMiles: Joi.number().min(0).max(50),

  // Text search on address/owner/parcel
  searchText: Joi.string().max(255),
  address: Joi.string().max(255),

  // Pagination
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100)
});

const leadListValidationSchema = Joi.object({
  name: Joi.string().required().max(255),
  description: Joi.string().max(1000),
  listType: Joi.string().required().valid('flip-candidates', 'rental-holds', 'wholesalers', 'foreclosures', 'high-equity', 'custom'),
  criteria: Joi.object().required()
});

function validateSearch(filters) {
  const { error, value } = searchValidationSchema.validate(filters, { 
    stripUnknown: true,
    abortEarly: false
  });

  if (error) {
    const details = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    }));
    throw {
      status: 400,
      message: 'Validation failed',
      details
    };
  }

  return value;
}

function validateLeadList(data) {
  const { error, value } = leadListValidationSchema.validate(data, {
    stripUnknown: true,
    abortEarly: false
  });

  if (error) {
    const details = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    }));
    throw {
      status: 400,
      message: 'Validation failed',
      details
    };
  }

  return value;
}

module.exports = {
  validateSearch,
  validateLeadList,
  searchValidationSchema,
  leadListValidationSchema
};
