import { Router } from "express";
import { prisma } from "@sales-agent/database";
import { z } from "zod";
import { runLeadPipeline, runDiscoverAndPipeline } from "../workflows/orchestrator.js";

export const leadsRouter = Router();

const DEFAULT_ORG = async () => {
  const org = await prisma.organization.findFirst({ where: { slug: "default" } });
  if (!org) throw new Error("Run db:seed first");
  return org.id;
};

leadsRouter.get("/", async (_req, res, next) => {
  try {
    const orgId = await DEFAULT_ORG();
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

    const orgId = await DEFAULT_ORG();
    const result = await runDiscoverAndPipeline(orgId, body.source, body.query);
    res.status(202).json(result);
  } catch (e) {
    next(e);
  }
});

leadsRouter.post("/:id/pipeline", async (req, res, next) => {
  try {
    const orgId = await DEFAULT_ORG();
    const result = await runLeadPipeline({
      organizationId: orgId,
      leadId: req.params.id,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});
