import { Router } from "express";
import { prisma } from "@sales-agent/database";
import { z } from "zod";
import { runLeadPipeline, runDiscoverSync } from "../workflows/orchestrator.js";
import { getDefaultOrganizationId } from "../lib/org.js";

export const leadsRouter = Router();

leadsRouter.get("/", async (_req, res, next) => {
  try {
    const orgId = await getDefaultOrganizationId();
    const leads = await prisma.lead.findMany({
      where: { organizationId: orgId },
      orderBy: { score: "desc" },
      take: 100,
      include: { research: true, contacts: true },
    });
    res.json(leads);
  } catch (e) {
    next(e);
  }
});

leadsRouter.get("/:id", async (req, res, next) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: {
        research: true,
        contacts: true,
        conversations: { include: { messages: true } },
        outreachEvents: true,
        deals: true,
      },
    });
    if (!lead) return res.status(404).json({ error: "Not found" });
    res.json(lead);
  } catch (e) {
    next(e);
  }
});

leadsRouter.post("/discover", async (req, res, next) => {
  try {
    const body = z
      .object({
        source: z.enum([
          "GOOGLE_MAPS",
          "LINKEDIN",
          "WEBSITE_SCRAPE",
          "DIRECTORY",
          "SOCIAL",
        ]),
        query: z.string().min(2),
      })
      .parse(req.body);

    const orgId = await getDefaultOrganizationId();
    const result = await runDiscoverSync(orgId, body.source, body.query, 5);
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

leadsRouter.post("/:id/pipeline", async (req, res, next) => {
  try {
    const orgId = await getDefaultOrganizationId();
    const result = await runLeadPipeline({
      organizationId: orgId,
      leadId: req.params.id,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});
