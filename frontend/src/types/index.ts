export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LeadTemplate {
  id: string;
  name: string;
  description: string;
  criteria: Record<string, unknown>;
}

export interface MarketTrend {
  propertyType: string;
  totalProperties: number;
  avgPrice: number;
  avgSoldPrice: number;
  avgSqft: number;
  avgPricePerSqft: number;
  priceRange: { min: number; max: number };
  avgYearBuilt: number;
}

export interface Property {
  id: string;
  address?: string;
  city?: string;
  state?: string;
  tax_assessed_value?: number;
  last_sale_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  property_type?: string;
  owner_type?: string;
  year_built?: number;
}

export interface SearchFilters {
  city?: string;
  state?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  bedroomsMin?: number;
  ownerType?: string;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  totalProperties: number;
  avgPrice: number;
  avgPricePerSqft: number;
  leadListCount: number;
}

export interface SavedLeadList {
  id: string;
  name: string;
  description?: string;
  listType: string;
  propertyCount: number;
  createdAt: string;
}

export interface MarketLocation {
  city: string;
  state: string;
}
