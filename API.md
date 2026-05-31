# Parcel Research Tool - API Documentation

Complete API reference for the Parcel Research Tool backend.

## Base URL
```
http://localhost:5000/api
```

## Health Check
```
GET /health
```

Returns server status and timestamp.

---

## Properties API

### Get Property Details
```
GET /api/properties/:id
```

**Response:**
```json
{
  "id": "uuid",
  "address": "123 Main St",
  "city": "Austin",
  "state": "TX",
  "owner": "John Doe",
  "taxValue": 250000,
  "bedrooms": 3,
  "bathrooms": 2,
  "sqft": 1500,
  "yearBuilt": 2005
}
```

### List Properties
```
GET /api/properties?page=1&limit=20
```

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Results per page (default: 20, max: 100)

---

## Search API

### Advanced Property Search
```
POST /api/search
```

**Request Body:**
```json
{
  "city": "Austin",
  "state": "TX",
  "priceMin": 100000,
  "priceMax": 500000,
  "propertyType": "single-family",
  "bedroomsMin": 2,
  "bedroomsMax": 5,
  "bathroomsMin": 1,
  "condition": "fair",
  "ownerType": "individual",
  "limit": 20,
  "page": 1
}
```

**Supported Filters (165+):**

**Location:**
- `city` - City name
- `state` - State code (2-letter)
- `zipCode` - ZIP code
- `counties` - Array of county names
- `latitude` - Geographic latitude
- `longitude` - Geographic longitude
- `radiusMiles` - Search radius in miles

**Price:**
- `priceMin` - Minimum property price
- `priceMax` - Maximum property price
- `taxValueMin` - Minimum tax assessed value
- `taxValueMax` - Maximum tax assessed value
- `lastSalePriceMin` - Minimum last sale price
- `lastSalePriceMax` - Maximum last sale price

**Property Details:**
- `propertyType` - 'single-family', 'multi-family', 'commercial', 'vacant-land', 'industrial'
- `propertyTypes` - Array of property types
- `bedroomsMin` - Minimum bedrooms
- `bedroomsMax` - Maximum bedrooms
- `bathroomsMin` - Minimum bathrooms
- `bathroomsMax` - Maximum bathrooms
- `sqftMin` - Minimum square footage
- `sqftMax` - Maximum square footage
- `lotSizeMin` - Minimum lot size (sqft)
- `lotSizeMax` - Maximum lot size (sqft)

**Property Age:**
- `yearBuiltMin` - Minimum year built
- `yearBuiltMax` - Maximum year built
- `condition` - 'excellent', 'good', 'fair', 'poor'

**Owner:**
- `ownerType` - 'individual', 'investor', 'corporation', 'non-profit', 'bank'
- `ownerTypes` - Array of owner types

**Other:**
- `searchText` - Text search on address/owner name
- `daysOnMarketMax` - Maximum days on market
- `estimatedValueMin` - Minimum Zestimate value
- `estimatedValueMax` - Maximum Zestimate value

**Response:**
```json
{
  "success": true,
  "message": "Property search completed",
  "data": [
    {
      "id": "uuid",
      "address": "123 Main St",
      "city": "Austin",
      "state": "TX",
      "taxValue": 250000,
      "bedrooms": 3,
      "bathrooms": 2,
      "sqft": 1500,
      "yearBuilt": 2005,
      "ownerName": "John Doe",
      "ownerType": "individual"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

### Get Lead List Templates
```
GET /api/search/templates
```

Returns predefined lead list templates (flip candidates, rentals, wholesalers, foreclosures, etc.)

### Get Lead List by Type
```
GET /api/search/leads/:type?city=Austin&state=TX
```

**Types:**
- `flip-candidates` - Properties needing repair
- `rental-holds` - Cash-flowing rental properties
- `wholesalers` - Undervalued wholesale deals
- `foreclosures` - Bank-owned properties
- `high-equity` - Properties with equity buildup

**Query Parameters:**
- `city` (required) - City name
- `state` (required) - State code
- `limit` - Max results (default: 50)

### Generate Custom Lead List
```
POST /api/search/leads
```

**Request Body:**
```json
{
  "listName": "Austin Fix & Flips",
  "listType": "flip-candidates",
  "criteria": {
    "city": "Austin",
    "state": "TX",
    "priceMax": 500000,
    "condition": "poor",
    "ownerType": "individual"
  },
  "userId": "optional-user-id"
}
```

---

## Comps API

### Find Comparable Properties
```
GET /api/comps/:propertyId?radius=0.5&maxComps=10
```

**Query Parameters:**
- `radius` - Search radius in miles (default: 0.5)
- `bedrooms` - Filter by bedroom count
- `bathrooms` - Filter by bathroom count
- `sqft` - Filter by square footage
- `maxComps` - Maximum comps to return (default: 10)

**Response:**
```json
{
  "success": true,
  "message": "Comparable properties found",
  "data": {
    "targetProperty": {...},
    "comps": [
      {
        "id": "uuid",
        "address": "456 Oak Ave",
        "price": 280000,
        "saleDate": "2023-03-20",
        "bedrooms": 3,
        "bathrooms": 2,
        "sqft": 1500,
        "pricePerSqft": 186.67,
        "distanceMiles": 0.25,
        "similarityScore": 0.92
      }
    ],
    "metrics": {
      "medianPrice": 285000,
      "avgPrice": 290000,
      "pricePerSqft": 192.33,
      "estimatedValue": 295000,
      "priceDeviation": {
        "fromMedian": -5000,
        "percentFromMedian": -1.75
      }
    }
  }
}
```

### Get Market Trends
```
GET /api/comps/market/trends?city=Austin&state=TX&propertyType=single-family
```

**Query Parameters:**
- `city` (required) - City name
- `state` (required) - State code
- `propertyType` - Optional property type filter

### Get Price Appreciation
```
GET /api/comps/appreciation?city=Austin&state=TX&years=5
```

**Query Parameters:**
- `city` (required) - City name
- `state` (required) - State code
- `years` - Period in years (default: 5)

---

## Deal Calculator API

### Calculate ROI (Fix & Flip)
```
POST /api/calculator/roi
```

**Request Body:**
```json
{
  "purchasePrice": 250000,
  "repairCosts": 50000,
  "afterRepairValue": 400000,
  "sellingCosts": 24000,
  "holdingCosts": 5000
}
```

**Response:**
```json
{
  "success": true,
  "message": "ROI calculation completed",
  "data": {
    "strategy": "Fix & Flip",
    "calculations": {
      "totalInvestment": 305000,
      "grossProfit": 95000,
      "netProfit": 71000,
      "roi": 23.28,
      "roiPercentage": "23.28%",
      "profitPerMonth": 11833,
      "profitMargin": 17.75
    },
    "recommendation": "GOOD - Solid flip opportunity"
  }
}
```

### Calculate Cash Flow (Rental)
```
POST /api/calculator/cashflow
```

**Request Body:**
```json
{
  "monthlyRent": 2000,
  "propertyTax": 250,
  "insurance": 120,
  "maintenance": 200,
  "utilities": 100,
  "vacancy": 5,
  "mortgagePayment": 1200,
  "hoa": 0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cash flow calculation completed",
  "data": {
    "strategy": "Rental",
    "calculations": {
      "effectiveMonthlyRent": 1900,
      "totalMonthlyExpenses": 1870,
      "monthlyNetCashFlow": 30,
      "annualNetCashFlow": 360,
      "expenseRatio": 93.5,
      "capRate": "N/A - provide property price for calculation"
    },
    "recommendation": "FAIR - Break-even property"
  }
}
```

### Calculate Maximum Allowable Offer (MAO)
```
POST /api/calculator/mao
```

**Request Body:**
```json
{
  "afterRepairValue": 400000,
  "estimatedRepairs": 50000,
  "holdingCosts": 5000,
  "exitCosts": 24000,
  "desiredProfit": 50000,
  "profitMargin": 0.2
}
```

**Response:**
```json
{
  "success": true,
  "message": "MAO calculation completed",
  "data": {
    "strategy": "Maximum Allowable Offer",
    "calculations": {
      "desiredProfit": 50000,
      "totalDeductions": 129000,
      "maximumOfferPrice": 271000,
      "pricePercentOfARV": 67.75
    },
    "breakdown": {
      "afterRepairValue": 400000,
      "less": {
        "repairs": 50000,
        "holding": 5000,
        "exit": 24000,
        "profit": 50000
      },
      "equals": {
        "mao": 271000
      }
    }
  }
}
```

### Calculate BRRRR Analysis
```
POST /api/calculator/brrrr
```

**Request Body:**
```json
{
  "purchasePrice": 250000,
  "repairCosts": 50000,
  "closingCosts": 5000,
  "afterRepairValue": 400000,
  "loanToValue": 0.75,
  "monthlyRent": 2000,
  "monthlyExpenses": 800,
  "propertyPrice": 400000
}
```

### Calculate Wholesale Analysis
```
POST /api/calculator/wholesale
```

**Request Body:**
```json
{
  "marketValue": 350000,
  "purchasePrice": 280000,
  "repairCosts": 40000,
  "buyerMargin": 0.2,
  "wholesaleFee": 0.05
}
```

---

## Lead Management API

### Get Saved Lead Lists
```
GET /api/leads
```

### Create Lead List
```
POST /api/leads
```

**Request Body:**
```json
{
  "name": "Austin Flip Candidates",
  "criteria": {
    "city": "Austin",
    "state": "TX",
    "condition": "poor"
  }
}
```

### Export Lead List
```
POST /api/leads/:id/export
```

**Request Body:**
```json
{
  "format": "csv"
}
```

### Delete Lead List
```
DELETE /api/leads/:id
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": [
    {
      "field": "priceMin",
      "message": "priceMin must be a positive number"
    }
  ]
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad request / Validation error
- `404` - Not found
- `500` - Server error

---

## Authentication

Currently no authentication required. JWT auth planned for future release.

---

## Rate Limiting

No rate limiting currently implemented. Will be added for production.

---

## Examples

### Find All 3-Bed Houses in Austin Under $400k
```bash
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Austin",
    "state": "TX",
    "priceMax": 400000,
    "propertyType": "single-family",
    "bedroomsMin": 3,
    "limit": 50
  }'
```

### Calculate Flip Deal
```bash
curl -X POST http://localhost:5000/api/calculator/roi \
  -H "Content-Type: application/json" \
  -d '{
    "purchasePrice": 250000,
    "repairCosts": 50000,
    "afterRepairValue": 400000,
    "sellingCosts": 24000
  }'
```

### Find Comparable Properties
```bash
curl http://localhost:5000/api/comps/property-uuid?radius=1&maxComps=15
```

### Get Rental Leads
```bash
curl http://localhost:5000/api/search/leads/rental-holds?city=Austin&state=TX&limit=100
```
