import { prisma } from "@sales-agent/database";
import type { AgentContext, AgentResult } from "@sales-agent/shared";
import { BaseAgent } from "./base.js";

export class OnboardingAgent extends BaseAgent<
  { dealId: string },
  { onboardingId: string }
> {
  readonly type = "ONBOARDING" as const;

  protected async execute(
    _ctx: AgentContext,
    input: { dealId: string }
  ): Promise<AgentResult<{ onboardingId: string }>> {
    const deal = await prisma.deal.findUniqueOrThrow({
      where: { id: input.dealId },
      include: { lead: true },
    });

    const onboarding = await prisma.onboarding.upsert({
      where: { dealId: deal.id },
      create: {
        dealId: deal.id,
        status: "IN_PROGRESS",
        accountId: `acct_${deal.lead.companyName.replace(/\W/g, "").toLowerCase()}_${Date.now()}`,
        checklist: [
          { step: "welcome_email", done: false },
          { step: "schedule_kickoff", done: false },
          { step: "crm_record", done: false },
          { step: "team_notify", done: false },
        ],
      },
      update: { status: "IN_PROGRESS" },
    });

    await this.sendWelcomeEmail(deal.lead.email, deal.lead.companyName);
    await prisma.onboarding.update({
      where: { id: onboarding.id },
      data: {
        welcomeSent: true,
        checklist: [
          { step: "welcome_email", done: true },
          { step: "schedule_kickoff", done: false },
          { step: "crm_record", done: true },
          { step: "team_notify", done: false },
        ],
      },
    });

    await prisma.lead.update({
      where: { id: deal.leadId },
      data: { status: "WON" },
    });

    return { success: true, data: { onboardingId: onboarding.id } };
  }

  private async sendWelcomeEmail(
    email: string | null,
    companyName: string
  ): Promise<void> {
    if (!email || !process.env.RESEND_API_KEY) {
      console.log(`[onboarding] Welcome email for ${companyName}`);
      return;
    }
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [email],
        subject: `Welcome to ${process.env.PRODUCT_NAME ?? "AI Automation Suite"}`,
        text: `Hi ${companyName} team,\n\nThank you for your purchase! We'll schedule your onboarding kickoff within 48 hours.\n\nBest,\nThe Team`,
      }),
    });
  }
}
