import { Router } from "express";
import { prisma } from "@sales-agent/database";

export const campaignsRouter = Router();

campaignsRouter.get("/", async (_req, res, next) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(campaigns);
  } catch (e) {
    next(e);
  }
});
