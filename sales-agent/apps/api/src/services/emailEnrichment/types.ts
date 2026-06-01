export type EnrichmentSource =
  | "existing"
  | "website_scrape"
  | "apollo"
  | "none";

export type EnrichmentConfidence = "high" | "medium" | "low";

export interface EnrichmentResult {
  email?: string;
  contactName?: string;
  contactTitle?: string;
  source: EnrichmentSource;
  confidence: EnrichmentConfidence;
  metadata?: Record<string, unknown>;
}

export interface EnrichLeadInput {
  leadId: string;
  companyName: string;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
}
