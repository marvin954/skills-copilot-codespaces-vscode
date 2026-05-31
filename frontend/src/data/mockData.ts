import { LeadTemplate, MarketTrend, DashboardStats } from '../types';

export const DEFAULT_LOCATION = { city: 'Austin', state: 'TX' };

export const MOCK_TEMPLATES: LeadTemplate[] = [
  {
    id: 'flip-candidates',
    name: 'Fix & Flip Candidates',
    description: 'Properties needing repair with good ROI potential',
    criteria: { condition: 'poor', ownerType: 'individual', priceMax: 500000 },
  },
  {
    id: 'rental-holds',
    name: 'Rental Hold Properties',
    description: 'Properties suitable for long-term rental income',
    criteria: { propertyTypes: ['single-family', 'multi-family'], sqftMin: 1200 },
  },
  {
    id: 'wholesalers',
    name: 'Wholesale Deals',
    description: 'Undervalued properties for quick deals',
    criteria: { ownerTypes: ['individual', 'investor'], priceMax: 250000 },
  },
  {
    id: 'foreclosures',
    name: 'Foreclosures',
    description: 'Bank-owned properties and foreclosures',
    criteria: { ownerType: 'bank' },
  },
  {
    id: 'high-equity',
    name: 'High Equity Opportunities',
    description: 'Properties with significant equity buildup',
    criteria: { yearBuiltMax: 2000 },
  },
];

export const MOCK_MARKET_TRENDS: MarketTrend[] = [
  {
    propertyType: 'single-family',
    totalProperties: 8420,
    avgPrice: 425000,
    avgSoldPrice: 398000,
    avgSqft: 1850,
    avgPricePerSqft: 215,
    priceRange: { min: 185000, max: 890000 },
    avgYearBuilt: 1998,
  },
  {
    propertyType: 'multi-family',
    totalProperties: 1240,
    avgPrice: 580000,
    avgSoldPrice: 545000,
    avgSqft: 3200,
    avgPricePerSqft: 170,
    priceRange: { min: 250000, max: 1200000 },
    avgYearBuilt: 1985,
  },
  {
    propertyType: 'condo',
    totalProperties: 2100,
    avgPrice: 310000,
    avgSoldPrice: 295000,
    avgSqft: 1100,
    avgPricePerSqft: 282,
    priceRange: { min: 150000, max: 650000 },
    avgYearBuilt: 2008,
  },
];

export const MOCK_STATS: DashboardStats = {
  totalProperties: 11760,
  avgPrice: 385000,
  avgPricePerSqft: 222,
  leadListCount: 0,
};

export const MOCK_PROPERTIES = [
  {
    id: '1',
    address: '4521 Oak Meadow Dr',
    city: 'Austin',
    state: 'TX',
    tax_assessed_value: 285000,
    last_sale_price: 275000,
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1650,
    property_type: 'single-family',
    owner_type: 'individual',
    year_built: 1995,
  },
  {
    id: '2',
    address: '789 Elm Street',
    city: 'Austin',
    state: 'TX',
    tax_assessed_value: 420000,
    last_sale_price: 410000,
    bedrooms: 4,
    bathrooms: 3,
    square_feet: 2200,
    property_type: 'single-family',
    owner_type: 'investor',
    year_built: 2008,
  },
  {
    id: '3',
    address: '1205 Riverside Blvd',
    city: 'Austin',
    state: 'TX',
    tax_assessed_value: 195000,
    last_sale_price: 188000,
    bedrooms: 2,
    bathrooms: 1,
    square_feet: 980,
    property_type: 'condo',
    owner_type: 'bank',
    year_built: 2012,
  },
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
