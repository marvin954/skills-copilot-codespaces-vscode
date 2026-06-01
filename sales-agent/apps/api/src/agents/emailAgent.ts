import { prisma } from "@sales-agent/database";
import type { AgentContext, AgentResult } from "@sales-agent/shared";
import { BaseAgent } from "./base.js";
import { complete } from "../services/llm.js";
import { PROMPTS } from "../prompts/index.js";
import {
  checkOutreachAllowed,
  appendCanSpamFooter,
  logCompliance,
} from "../services/compliance.js";

export class EmailAgent extends BaseAgent<
  { leadId: string; campaignId?: string },
  { outreachEventId: string }
> {
  readonly type = "EMAIL" as const;

  protected async execute(
    ctx: AgentContext,
    input: { leadId: string; campaignId?: string }
  ): Promise<AgentResult<{ outreachEventId: string }>> {
    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: input.leadId },
      include: { research: true, contacts: true },
    });

    const email = lead.email ?? lead.contacts.find((c) => c.email)?.email;
    const compliance = await checkOutreachAllowed({
      leadId: lead.id,
      email: email ?? undefined,
      channel: "EMAIL",
    });

    if (!compliance.allowed) {
      await logCompliance(compliance.logAction, { reason: compliance.reason }, lead.id, "EMAIL");
      return { success: false, error: compliance.reason };
    }

    const raw = await complete([
      { role: "system", content: "Output valid JSON only." },
      {
        role: "user",
        content: PROMPTS.emailOutreach({
          companyName: lead.companyName,
          contactName: lead.contacts[0]?.name,
          salesAngle: lead.research?.salesAngle ?? "AI automation for growing SMBs",
          productName: process.env.PRODUCT_NAME ?? "AI Automation Suite",
        }),
      },
    ]);

    const { subject, body } = JSON.parse(
      raw.replace(/```json\n?|\n?```/g, "")
    ) as { subject: string; body: string };

    const fullBody = appendCanSpamFooter(body);
    const externalId = await this.sendEmail(email!, subject, fullBody);

    const event = await prisma.outreachEvent.create({
      data: {
        leadId: lead.id,
        campaignId: input.campaignId,
        channel: "EMAIL",
        direction: "OUTBOUND",
        subject,
        body: fullBody,
        externalId,
        status: externalId ? "SENT" : "QUEUED",
        sentAt: externalId ? new Date() : undefined,
      },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "CONTACTED" },
    });

    await logCompliance("email_sent", { subject, outreachEventId: event.id }, lead.id, "EMAIL");

    return { success: true, data: { outreachEventId: event.id } };
  }

  private async sendEmail(
    to: string,
    subject: string,
    body: string
  ): Promise<string | undefined> {
    if (!process.env.RESEND_API_KEY) {
      console.log(`[email:dry-run] To: ${to} | ${subject}`);
      return `dry-run-${Date.now()}`;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [to],
        subject,
        text: body,
      }),
    });

    if (!res.ok) throw new Error(`Resend error: ${await res.text()}`);
    const data = (await res.json()) as { id: string };
    return data.id;
  }
}
