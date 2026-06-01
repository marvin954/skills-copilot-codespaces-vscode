import { Router } from "express";
import { z } from "zod";
import { prisma } from "@sales-agent/database";
import { getDefaultOrganizationId } from "../lib/org.js";
import { runLeadPipeline, runDiscoverSync } from "../workflows/orchestrator.js";
import { ManagerAgent } from "../agents/managerAgent.js";
import { enqueueWorkflow } from "../workflows/orchestrator.js";
import {
  isGooglePlacesConfigured,
  shouldUseGooglePlacesMock,
} from "../services/googlePlaces.js";

export const controlRouter = Router();

controlRouter.get("/status", async (_req, res, next) => {
  try {
    const orgId = await getDefaultOrganizationId();
    const [leadCount, recentRuns, lastReport] = await Promise.all([
      prisma.lead.count({ where: { organizationId: orgId } }),
      prisma.agentRun.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      prisma.managerReport.findFirst({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    res.json({
      organizationId: orgId,
      leadCount,
      recentRuns,
      lastManagerReport: lastReport,
      agents: [
        "LEAD_FINDER",
        "LEAD_RESEARCH",
        "LEAD_SCORING",
        "EMAIL",
        "CONVERSATION",
        "CLOSING",
        "ONBOARDING",
        "MANAGER",
      ],
    });
  } catch (e) {
    next(e);
  }
});

controlRouter.get("/google-places/status", (_req, res) => {
  res.json({
    configured: isGooglePlacesConfigured(),
    mockMode: shouldUseGooglePlacesMock(),
    hint: "Enable Places API (New) + Geocoding API in Google Cloud. See docs/GOOGLE_MAPS_SETUP.md",
  });
});

controlRouter.get("/runs", async (req, res, next) => {
  try {
    const orgId = await getDefaultOrganizationId();
    const limit = Number(req.query.limit ?? 20);
    const runs = await prisma.agentRun.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 50),
    });
    res.json(runs);
  } catch (e) {
    next(e);
  }
});

controlRouter.post("/discover", async (req, res, next) => {
  try {
    const body = z
      .object({
        source: z
          .enum([
            "GOOGLE_MAPS",
            "LINKEDIN",
            "WEBSITE_SCRAPE",
            "DIRECTORY",
            "SOCIAL",
          ])
          .default("GOOGLE_MAPS"),
        query: z.string().min(2),
        location: z.string().optional(),
        industry: z.string().optional(),
        limit: z.number().int().min(1).max(20).optional(),
        mode: z.enum(["sync", "async"]).default("sync"),
      })
      .parse(req.body);

    const orgId = await getDefaultOrganizationId();

    if (body.mode === "async") {
      await enqueueWorkflow({
        type: "discover",
        organizationId: orgId,
        source: body.source,
        query: body.query,
        location: body.location,
        industry: body.industry,
        limit: body.limit,
      });
      return res.status(202).json({
        ok: true,
        message: "Discover job queued. Ensure worker is running.",
      });
    }

    const result = await runDiscoverSync(
      orgId,
      body.source,
      body.query,
      body.limit ?? 5,
      { location: body.location, industry: body.industry }
    );
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

controlRouter.post("/pipeline/:leadId", async (req, res, next) => {
  try {
    const orgId = await getDefaultOrganizationId();
    const result = await runLeadPipeline({
      organizationId: orgId,
      leadId: req.params.leadId,
    });
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

controlRouter.post("/pipeline/:leadId/queue", async (req, res, next) => {
  try {
    const orgId = await getDefaultOrganizationId();
    await enqueueWorkflow({
      type: "full_pipeline",
      organizationId: orgId,
      leadId: req.params.leadId,
    });
    res.status(202).json({ ok: true, queued: true, leadId: req.params.leadId });
  } catch (e) {
    next(e);
  }
});

controlRouter.post("/manager-report", async (req, res, next) => {
  try {
    const body = z.object({ periodDays: z.number().int().min(1).max(90).optional() }).parse(req.body ?? {});
    const orgId = await getDefaultOrganizationId();
    const agent = new ManagerAgent();
    const result = await agent.run({ organizationId: orgId }, { periodDays: body.periodDays ?? 7 });
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

controlRouter.post("/checkout", async (req, res, next) => {
  try {
    const body = z
      .object({
        leadId: z.string(),
        amount: z.number().positive(),
      })
      .parse(req.body);

    const { ClosingAgent } = await import("../agents/closingAgent.js");
    const orgId = await getDefaultOrganizationId();
    const agent = new ClosingAgent();
    const result = await agent.run(
      { organizationId: orgId, leadId: body.leadId },
      { leadId: body.leadId, amount: body.amount }
    );
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});
