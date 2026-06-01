import { Router } from "express";
import Stripe from "stripe";
import { prisma } from "@sales-agent/database";
import { OnboardingAgent } from "../agents/onboardingAgent.js";

export const webhooksRouter = Router();

webhooksRouter.post("/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(200).json({ received: true, mode: "mock" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  await prisma.webhookEvent.create({
    data: {
      provider: "stripe",
      eventType: event.type,
      payload: event as object,
    },
  });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const dealId = session.metadata?.dealId;
    if (dealId) {
      const deal = await prisma.deal.update({
        where: { id: dealId },
        data: {
          stage: "WON",
          stripePaymentId: session.payment_intent as string,
          closedAt: new Date(),
        },
        include: { lead: true },
      });

      const org = await prisma.organization.findFirst();
      if (org) {
        const onboarding = new OnboardingAgent();
        await onboarding.run(
          { organizationId: org.id, leadId: deal.leadId },
          { dealId }
        );
      }
    }
  }

  res.json({ received: true });
});

webhooksRouter.post("/n8n", async (req, res) => {
  await prisma.webhookEvent.create({
    data: {
      provider: "n8n",
      eventType: "automation",
      payload: req.body as object,
      processed: true,
      processedAt: new Date(),
    },
  });
  res.json({ ok: true });
});

webhooksRouter.post("/resend", async (req, res) => {
  const payload = req.body as { type?: string; data?: { email_id?: string } };
  if (payload.type === "email.opened" && payload.data?.email_id) {
    await prisma.outreachEvent.updateMany({
      where: { externalId: payload.data.email_id },
      data: { status: "OPENED", openedAt: new Date() },
    });
  }
  res.json({ ok: true });
});
