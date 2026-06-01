import { Router } from "express";
import { z } from "zod";
import { prisma } from "@sales-agent/database";
import { enqueueWorkflow } from "../workflows/orchestrator.js";
import { ManagerAgent } from "../agents/managerAgent.js";

export const workflowRouter = Router();

workflowRouter.post("/enqueue", async (req, res, next) => {
  try {
    const job = z
      .object({
        type: z.enum(["full_pipeline", "discover", "close_and_onboard"]),
        organizationId: z.string(),
        leadId: z.string().optional(),
        source: z.string().optional(),
        query: z.string().optional(),
        amount: z.number().optional(),
      })
      .parse(req.body);

    await enqueueWorkflow(job as Parameters<typeof enqueueWorkflow>[0]);
    res.status(202).json({ queued: true });
  } catch (e) {
    next(e);
  }
});

workflowRouter.post("/manager-report", async (_req, res, next) => {
  try {
    const org = await prisma.organization.findFirst({
      where: { slug: "default" },
    });
    if (!org) return res.status(400).json({ error: "Seed database first" });

    const agent = new ManagerAgent();
    const result = await agent.run({ organizationId: org.id }, { periodDays: 7 });
    res.json(result);
  } catch (e) {
    next(e);
  }
});
