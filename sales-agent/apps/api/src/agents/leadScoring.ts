import { prisma } from "@sales-agent/database";
import { computeLeadScore, type LeadScoreBreakdown } from "@sales-agent/shared";
import type { AgentContext, AgentResult } from "@sales-agent/shared";
import { BaseAgent } from "./base.js";

export class LeadScoringAgent extends BaseAgent<
  { leadId: string },
  { score: number; breakdown: LeadScoreBreakdown }
> {
  readonly type = "LEAD_SCORING" as const;

  protected async execute(
    ctx: AgentContext,
    input: { leadId: string }
  ): Promise<AgentResult<{ score: number; breakdown: LeadScoreBreakdown }>> {
    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: input.leadId },
      include: { research: true },
    });

    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
    });
    const settings = org.settings as { targetIndustries?: string[] };

    const metadata = lead.metadata as { hiringCount?: number; growthSignals?: string[] };
    const breakdown = computeLeadScore({
      employeeCount: lead.employeeCount ?? undefined,
      hasWebsite: Boolean(lead.website),
      websiteQualityScore: lead.website ? 70 : 20,
      techStack: lead.techStack,
      growthSignals: metadata.growthSignals,
      hiringCount: metadata.hiringCount,
      industry: lead.industry ?? undefined,
      targetIndustries: settings.targetIndustries,
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        score: breakdown.total,
        scoreBreakdown: breakdown as object,
        status: breakdown.total >= 60 ? "OUTREACH_QUEUED" : "NURTURING",
      },
    });

    return {
      success: true,
      data: { score: breakdown.total, breakdown },
    };
  }
}
