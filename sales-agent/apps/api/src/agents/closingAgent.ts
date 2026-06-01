import Stripe from "stripe";
import { prisma } from "@sales-agent/database";
import type { AgentContext, AgentResult, ClosingOffer } from "@sales-agent/shared";
import { BaseAgent } from "./base.js";

export class ClosingAgent extends BaseAgent<
  { leadId: string; amount: number; title?: string },
  ClosingOffer
> {
  readonly type = "CLOSING" as const;

  protected async execute(
    ctx: AgentContext,
    input: { leadId: string; amount: number; title?: string }
  ): Promise<AgentResult<ClosingOffer>> {
    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: input.leadId },
    });

    const title =
      input.title ??
      `AI Automation — ${lead.companyName}`;

    let deal = await prisma.deal.findFirst({
      where: { leadId: lead.id, stage: { notIn: ["WON", "LOST"] } },
    });

    if (!deal) {
      deal = await prisma.deal.create({
        data: {
          organizationId: ctx.organizationId,
          leadId: lead.id,
          title,
          amount: input.amount,
          stage: "CHECKOUT",
        },
      });
    }

    const checkoutUrl = await this.createCheckoutSession(deal.id, input.amount, title);

    await prisma.deal.update({
      where: { id: deal.id },
      data: { stage: "PAYMENT_PENDING", stripeSessionId: checkoutUrl.sessionId },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "NEGOTIATING" },
    });

    return {
      success: true,
      data: {
        title,
        amount: input.amount,
        currency: "USD",
        checkoutUrl: checkoutUrl.url,
        terms: "Standard MSA; 30-day implementation kickoff upon payment.",
      },
    };
  }

  private async createCheckoutSession(
    dealId: string,
    amount: number,
    title: string
  ): Promise<{ url: string; sessionId: string }> {
    if (!process.env.STRIPE_SECRET_KEY) {
      const mockUrl = `${process.env.PRODUCT_WEBSITE ?? "https://example.com"}/checkout?deal=${dealId}`;
      return { url: mockUrl, sessionId: `mock_${dealId}` };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${process.env.PRODUCT_WEBSITE}/success?deal=${dealId}`,
      cancel_url: `${process.env.PRODUCT_WEBSITE}/cancel?deal=${dealId}`,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: title },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { dealId },
    });

    return { url: session.url!, sessionId: session.id };
  }
}
