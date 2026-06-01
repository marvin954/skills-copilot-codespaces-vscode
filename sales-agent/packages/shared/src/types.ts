export interface LeadCandidate {
  companyName: string;
  website?: string;
  email?: string;
  phone?: string;
  industry?: string;
  employeeCount?: number;
  location?: string;
  source: string;
  metadata?: Record<string, unknown>;
  contacts?: Array<{
    name: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
  }>;
}

export interface LeadScoreBreakdown {
  companySize: number;
  revenueIndicators: number;
  websiteQuality: number;
  techStack: number;
  growthSignals: number;
  hiringActivity: number;
  industryFit: number;
  total: number;
}

export interface LeadResearchResult {
  painSummary: string;
  opportunitySummary: string;
  salesAngle: string;
  estimatedValue: number;
  competitorNotes?: string;
  websiteAnalysis: Record<string, unknown>;
  personalizedPitch: string;
}

export interface OutreachMessage {
  subject?: string;
  body: string;
  channel: "EMAIL" | "SMS" | "LINKEDIN" | "VOICE";
}

export interface AgentContext {
  organizationId: string;
  leadId?: string;
  playbookId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metrics?: Record<string, number>;
}

export interface ConversationTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ClosingOffer {
  title: string;
  amount: number;
  currency: string;
  checkoutUrl?: string;
  terms: string;
}

export interface DashboardMetrics {
  leadsGenerated: number;
  emailsSent: number;
  repliesReceived: number;
  meetingsBooked: number;
  dealsClosed: number;
  revenueGenerated: number;
  conversionRate: number;
  avgLeadScore: number;
}

export interface ManagerOptimization {
  channel: string;
  action: string;
  reason: string;
  priority: "low" | "medium" | "high";
}

export interface PlaybookConfig {
  slug: string;
  name: string;
  productSummary: string;
  pricingTiers: Array<{ name: string; price: number; period: string }>;
  objectionRules: Array<{ objection: string; response: string }>;
  negotiationMax: { maxDiscountPercent?: number; canOfferTrial?: boolean };
}

export interface ComplianceCheckResult {
  allowed: boolean;
  reason?: string;
  logAction: string;
}
