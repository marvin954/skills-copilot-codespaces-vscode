import { prisma } from "@sales-agent/database";
import type { AgentContext, AgentResult, LeadResearchResult } from "@sales-agent/shared";
import { PRODUCT_OFFERING } from "@sales-agent/shared";
import { BaseAgent } from "./base.js";
import { complete } from "../services/llm.js";
import { PROMPTS } from "../prompts/index.js";

export class LeadResearchAgent extends BaseAgent<
  { leadId: string },
  LeadResearchResult
> {
  readonly type = "LEAD_RESEARCH" as const;

  protected async execute(
    _ctx: AgentContext,
    input: { leadId: string }
  ): Promise<AgentResult<LeadResearchResult>> {
    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: input.leadId },
      include: { contacts: true },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "RESEARCHING" },
    });

    const websiteText = lead.website
      ? await this.fetchWebsiteSnippet(lead.website)
      : "";

    const raw = await complete([
      {
        role: "system",
        content: "You output valid JSON only. No markdown fences.",
      },
      {
        role: "user",
        content:
          PROMPTS.researchLead({
            companyName: lead.companyName,
            website: lead.website ?? undefined,
            industry: lead.industry ?? undefined,
            productOffering: PRODUCT_OFFERING.services.join(", "),
          }) + (websiteText ? `\n\nWebsite excerpt:\n${websiteText}` : ""),
      },
    ]);

    const parsed = this.parseJson(raw);
    const result: LeadResearchResult = {
      painSummary: String(parsed.painSummary ?? ""),
      opportunitySummary: String(parsed.opportunitySummary ?? ""),
      salesAngle: String(parsed.salesAngle ?? ""),
      estimatedValue: Number(parsed.estimatedValue ?? 5000),
      competitorNotes: parsed.competitorNotes
        ? String(parsed.competitorNotes)
        : undefined,
      websiteAnalysis: { excerpt: websiteText.slice(0, 500) },
      personalizedPitch: String(parsed.personalizedPitch ?? ""),
    };

    await prisma.leadResearch.upsert({
      where: { leadId: lead.id },
      create: {
        leadId: lead.id,
        ...result,
        estimatedValue: result.estimatedValue,
      },
      update: {
        ...result,
        estimatedValue: result.estimatedValue,
        researchedAt: new Date(),
      },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "SCORED" },
    });

    return { success: true, data: result };
  }

  private async fetchWebsiteSnippet(url: string): Promise<string> {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "SalesAgentResearch/1.0" },
      });
      const html = await res.text();
      return html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .slice(0, 3000);
    } catch {
      return "";
    }
  }

  private parseJson(raw: string): Record<string, unknown> {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned) as Record<string, unknown>;
  }
}
