import { Router } from "express";
import { z } from "zod";
import { prisma } from "@sales-agent/database";
import { getDefaultOrganizationId } from "../lib/org.js";
import {
  enrichAndSaveLead,
  enrichLeadsBatch,
  isApolloConfigured,
} from "../services/emailEnrichment/index.js";
import { isWebsiteScrapeEnabled } from "../services/emailEnrichment/websiteScraper.js";

export const enrichmentRouter = Router();

enrichmentRouter.get("/status", (_req, res) => {
  res.json({
    websiteScrape: isWebsiteScrapeEnabled(),
    apollo: isApolloConfigured(),
    hint: "Set APOLLO_API_KEY for Apollo; website scrape on by default",
  });
});

enrichmentRouter.post("/lead/:leadId", async (req, res, next) => {
  try {
    const result = await enrichAndSaveLead(req.params.leadId);
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

enrichmentRouter.post("/batch", async (req, res, next) => {
  try {
    const body = z
      .object({
        leadIds: z.array(z.string()).optional(),
        allWithoutEmail: z.boolean().optional(),
        limit: z.number().int().min(1).max(50).optional(),
      })
      .parse(req.body ?? {});

    let leadIds = body.leadIds ?? [];

    if (body.allWithoutEmail) {
      const orgId = await getDefaultOrganizationId();
      const leads = await prisma.lead.findMany({
        where: {
          organizationId: orgId,
          OR: [{ email: null }, { email: "" }],
        },
        select: { id: true },
        take: body.limit ?? 25,
        orderBy: { createdAt: "desc" },
      });
      leadIds = leads.map((l) => l.id);
    }

    const result = await enrichLeadsBatch(leadIds);
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});
