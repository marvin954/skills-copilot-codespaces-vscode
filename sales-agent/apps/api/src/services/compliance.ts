import { prisma } from "@sales-agent/database";
import type { ComplianceCheckResult } from "@sales-agent/shared";

export async function checkOutreachAllowed(params: {
  leadId?: string;
  email?: string;
  phone?: string;
  channel: "EMAIL" | "SMS" | "LINKEDIN" | "VOICE";
}): Promise<ComplianceCheckResult> {
  const { leadId, email, phone, channel } = params;

  if (email) {
    const opted = await prisma.optOut.findFirst({ where: { email } });
    if (opted) {
      return { allowed: false, reason: "Email opted out", logAction: "opt_out_block" };
    }
  }
  if (phone) {
    const opted = await prisma.optOut.findFirst({ where: { phone } });
    if (opted) {
      return { allowed: false, reason: "Phone opted out", logAction: "opt_out_block" };
    }
  }

  if (leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (lead?.optOut) {
      return { allowed: false, reason: "Lead opted out", logAction: "lead_opt_out" };
    }
  }

  if (channel === "SMS" || channel === "VOICE") {
    const hour = getLocalHour();
    const start = Number(process.env.QUIET_HOURS_START ?? 21);
    const end = Number(process.env.QUIET_HOURS_END ?? 8);
    if (isQuietHours(hour, start, end)) {
      return {
        allowed: false,
        reason: "TCPA quiet hours",
        logAction: "quiet_hours_block",
      };
    }
  }

  const dailyLimit = getDailyLimit(channel);
  const sentToday = await countSentToday(channel);
  if (sentToday >= dailyLimit) {
    return {
      allowed: false,
      reason: `Daily ${channel} limit reached`,
      logAction: "rate_limit_block",
    };
  }

  return { allowed: true, logAction: "outreach_allowed" };
}

function getLocalHour(): number {
  const tz = process.env.DEFAULT_TIMEZONE ?? "America/New_York";
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    hour12: false,
  });
  return Number(formatter.format(new Date()));
}

function isQuietHours(hour: number, start: number, end: number): boolean {
  if (start > end) return hour >= start || hour < end;
  return hour >= start && hour < end;
}

function getDailyLimit(channel: string): number {
  switch (channel) {
    case "EMAIL":
      return Number(process.env.MAX_EMAILS_PER_DAY ?? 500);
    case "SMS":
      return Number(process.env.MAX_SMS_PER_DAY ?? 100);
    case "VOICE":
      return Number(process.env.MAX_CALLS_PER_DAY ?? 50);
    default:
      return 200;
  }
}

async function countSentToday(channel: string): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.outreachEvent.count({
    where: {
      channel: channel as "EMAIL" | "SMS" | "LINKEDIN" | "VOICE",
      status: { in: ["SENT", "DELIVERED", "OPENED", "CLICKED", "REPLIED"] },
      sentAt: { gte: start },
    },
  });
}

export async function logCompliance(
  action: string,
  details: Record<string, unknown>,
  leadId?: string,
  channel?: string
): Promise<void> {
  await prisma.complianceLog.create({
    data: {
      leadId,
      channel: channel ?? "system",
      action,
      details,
    },
  });
}

export function appendCanSpamFooter(body: string): string {
  const company = process.env.COMPANY_NAME ?? "Our Company";
  const address = process.env.COMPANY_ADDRESS ?? "";
  const base = process.env.UNSUBSCRIBE_BASE_URL ?? "https://example.com/unsubscribe";
  return `${body}\n\n---\n${company}${address ? `\n${address}` : ""}\nUnsubscribe: ${base}?channel=email`;
}
