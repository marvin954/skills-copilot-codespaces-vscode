import { Router } from "express";
import { prisma } from "@sales-agent/database";
import { z } from "zod";
import { logCompliance } from "../services/compliance.js";

export const optOutRouter = Router();

optOutRouter.post("/", async (req, res, next) => {
  try {
    const body = z
      .object({
        email: z.string().email().optional(),
        phone: z.string().optional(),
        channel: z.string().optional(),
        reason: z.string().optional(),
      })
      .parse(req.body);

    await prisma.optOut.create({ data: body });

    if (body.email) {
      await prisma.lead.updateMany({
        where: { email: body.email },
        data: { optOut: true, optOutAt: new Date(), status: "OPTED_OUT" },
      });
    }

    await logCompliance("opt_out", body);

    res.json({ success: true, message: "You have been unsubscribed." });
  } catch (e) {
    next(e);
  }
});
