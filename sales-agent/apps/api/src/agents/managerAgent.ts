import { prisma } from "@sales-agent/database";
import type { AgentContext, AgentResult, ManagerOptimization } from "@sales-agent/shared";
import { BaseAgent } from "./base.js";
import { complete } from "../services/llm.js";
import { PROMPTS } from "../prompts/index.js";

export class ManagerAgent extends BaseAgent<
  { periodDays?: number },
  { reportId: string; recommendations: ManagerOptimization[] }
> {
  readonly type = "MANAGER" as const;

  protected async execute(
    ctx: AgentContext,
    input: { periodDays?: number }
  ): Promise<
    AgentResult<{ reportId: string; recommendations: ManagerOptimization[] }>
  > {
    const days = input.periodDays ?? 7;
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - days * 86400000);

    const [leads, emails, replies, meetings, wonDeals] = await Promise.all([
      prisma.lead.count({
        where: {
          organizationId: ctx.organizationId,
          createdAt: { gte: periodStart },
        },
      }),
      prisma.outreachEvent.count({
        where: { channel: "EMAIL", sentAt: { gte: periodStart } },
      }),
      prisma.outreachEvent.count({
        where: { repliedAt: { gte: periodStart } },
      }),
      prisma.meeting.count({
        where: { createdAt: { gte: periodStart } },
      }),
      prisma.deal.findMany({
        where: {
          organizationId: ctx.organizationId,
          stage: "WON",
          closedAt: { gte: periodStart },
        },
      }),
    ]);

    const revenue = wonDeals.reduce((s, d) => s + Number(d.amount), 0);
    const metricsStr = JSON.stringify({
      leads,
      emails,
      replies,
      meetings,
      dealsClosed: wonDeals.length,
      revenue,
      replyRate: emails ? (replies / emails) * 100 : 0,
    });

    const raw = await complete([
      { role: "system", content: "Output valid JSON only." },
      { role: "user", content: PROMPTS.managerReport(metricsStr) },
    ]);

    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "")) as {
      summary: string;
      recommendations: ManagerOptimization[];
    };

    const report = await prisma.managerReport.create({
      data: {
        organizationId: ctx.organizationId,
        periodStart,
        periodEnd,
        metrics: { leads, emails, replies, meetings, revenue },
        recommendations: parsed.recommendations as object[],
      },
    });

    return {
      success: true,
      data: {
        reportId: report.id,
        recommendations: parsed.recommendations,
      },
    };
  }
}
