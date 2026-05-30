import type { LeadScoreBreakdown } from "./types.js";

export interface ScoringInput {
  employeeCount?: number;
  hasWebsite?: boolean;
  websiteQualityScore?: number;
  techStack?: string[];
  growthSignals?: string[];
  hiringCount?: number;
  industry?: string;
  targetIndustries?: string[];
}

const WEIGHTS = {
  companySize: 0.15,
  revenueIndicators: 0.15,
  websiteQuality: 0.15,
  techStack: 0.1,
  growthSignals: 0.15,
  hiringActivity: 0.15,
  industryFit: 0.15,
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function scoreCompanySize(employees?: number): number {
  if (!employees) return 40;
  if (employees >= 5 && employees <= 50) return 95;
  if (employees <= 200) return 85;
  if (employees <= 500) return 60;
  return 35;
}

function scoreWebsiteQuality(hasWebsite?: boolean, quality?: number): number {
  if (!hasWebsite) return 20;
  return clamp(quality ?? 65);
}

function scoreIndustryFit(
  industry?: string,
  targets: string[] = []
): number {
  if (!industry) return 50;
  const lower = industry.toLowerCase();
  const match = targets.some((t) => lower.includes(t.toLowerCase()));
  return match ? 90 : 55;
}

export function computeLeadScore(input: ScoringInput): LeadScoreBreakdown {
  const companySize = scoreCompanySize(input.employeeCount);
  const revenueIndicators = clamp(
    (input.employeeCount ?? 10) * 2 + (input.hasWebsite ? 20 : 0)
  );
  const websiteQuality = scoreWebsiteQuality(
    input.hasWebsite,
    input.websiteQualityScore
  );
  const techStack = clamp((input.techStack?.length ?? 0) * 15 + 30);
  const growthSignals = clamp((input.growthSignals?.length ?? 0) * 20 + 40);
  const hiringActivity = clamp((input.hiringCount ?? 0) * 25 + 35);
  const industryFit = scoreIndustryFit(input.industry, input.targetIndustries);

  const total = clamp(
    companySize * WEIGHTS.companySize +
      revenueIndicators * WEIGHTS.revenueIndicators +
      websiteQuality * WEIGHTS.websiteQuality +
      techStack * WEIGHTS.techStack +
      growthSignals * WEIGHTS.growthSignals +
      hiringActivity * WEIGHTS.hiringActivity +
      industryFit * WEIGHTS.industryFit
  );

  return {
    companySize,
    revenueIndicators,
    websiteQuality,
    techStack,
    growthSignals,
    hiringActivity,
    industryFit,
    total,
  };
}
