import { Router } from "express";
import { prisma } from "@sales-agent/database";
import type { DashboardMetrics } from "@sales-agent/shared";

export const dashboardRouter = Router();

dashboardRouter.get("/metrics", async (_req, res, next) => {
  try {
    const start = new Date();
    start.setDate(start.getDate() - 30);

    const [
      leadsGenerated,
      emailsSent,
      repliesReceived,
      meetingsBooked,
      dealsClosed,
      revenueAgg,
      avgScore,
    ] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: start } } }),
      prisma.outreachEvent.count({
        where: { channel: "EMAIL", sentAt: { gte: start } },
      }),
      prisma.outreachEvent.count({
        where: { repliedAt: { gte: start } },
      }),
      prisma.meeting.count({ where: { createdAt: { gte: start } } }),
      prisma.deal.count({
        where: { stage: "WON", closedAt: { gte: start } },
      }),
      prisma.deal.aggregate({
        where: { stage: "WON", closedAt: { gte: start } },
        _sum: { amount: true },
      }),
      prisma.lead.aggregate({ _avg: { score: true } }),
    ]);

    const metrics: DashboardMetrics = {
      leadsGenerated,
      emailsSent,
      repliesReceived,
      meetingsBooked,
      dealsClosed,
      revenueGenerated: Number(revenueAgg._sum.amount ?? 0),
      conversionRate:
        leadsGenerated > 0 ? (dealsClosed / leadsGenerated) * 100 : 0,
      avgLeadScore: Math.round(avgScore._avg.score ?? 0),
    };

    res.json(metrics);
  } catch (e) {
    next(e);
  }
});
