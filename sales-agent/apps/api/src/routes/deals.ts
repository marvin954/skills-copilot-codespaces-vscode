import { Router } from "express";
import { prisma } from "@sales-agent/database";
import { z } from "zod";
import { ClosingAgent } from "../agents/closingAgent.js";

export const dealsRouter = Router();

dealsRouter.get("/", async (_req, res, next) => {
  try {
    const deals = await prisma.deal.findMany({
      orderBy: { updatedAt: "desc" },
      include: { lead: true },
      take: 50,
    });
    res.json(deals);
  } catch (e) {
    next(e);
  }
});

dealsRouter.post("/checkout", async (req, res, next) => {
  try {
    const body = z
      .object({
        leadId: z.string(),
        amount: z.number().positive(),
        organizationId: z.string().optional(),
      })
      .parse(req.body);

    const org =
      body.organizationId ??
      (await prisma.organization.findFirst({ where: { slug: "default" } }))!.id;

    const agent = new ClosingAgent();
    const result = await agent.run(
      { organizationId: org, leadId: body.leadId },
      { leadId: body.leadId, amount: body.amount }
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});
