import { Router } from "express";
import { prisma } from "@sales-agent/database";
import { z } from "zod";

export const playbooksRouter = Router();

playbooksRouter.get("/", async (_req, res, next) => {
  try {
    const playbooks = await prisma.playbook.findMany({
      where: { isActive: true },
    });
    res.json(playbooks);
  } catch (e) {
    next(e);
  }
});

playbooksRouter.post("/", async (req, res, next) => {
  try {
    const body = z
      .object({
        organizationId: z.string(),
        slug: z.string(),
        name: z.string(),
        productSummary: z.string(),
        industry: z.string().optional(),
        pricingTiers: z.array(z.unknown()).optional(),
      })
      .parse(req.body);

    const playbook = await prisma.playbook.create({ data: body });
    res.status(201).json(playbook);
  } catch (e) {
    next(e);
  }
});
