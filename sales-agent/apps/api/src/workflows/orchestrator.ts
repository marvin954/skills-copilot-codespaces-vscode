import { prisma } from "@sales-agent/database";
import type { AgentContext } from "@sales-agent/shared";
import {
  LeadFinderAgent,
  LeadResearchAgent,
  LeadScoringAgent,
  EmailAgent,
  ClosingAgent,
  OnboardingAgent,
} from "../agents/index.js";
import { createQueue, QUEUE_NAMES } from "../lib/queue.js";

export const workflowQueue = createQueue(QUEUE_NAMES.WORKFLOW);

export type WorkflowJob =
  | { type: "full_pipeline"; organizationId: string; leadId: string }
  | { type: "discover"; organizationId: string; source: string; query: string }
  | { type: "close_and_onboard"; organizationId: string; leadId: string; amount: number };

export async function enqueueWorkflow(job: WorkflowJob) {
  await workflowQueue.add(job.type, job, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}

/** Autonomous pipeline: research → score → outreach */
export async function runLeadPipeline(ctx: AgentContext) {
  if (!ctx.leadId) throw new Error("leadId required");

  const research = new LeadResearchAgent();
  const scoring = new LeadScoringAgent();
  const email = new EmailAgent();

  await research.run(ctx, { leadId: ctx.leadId });
  const scoreResult = await scoring.run(ctx, { leadId: ctx.leadId });

  if (scoreResult.data && scoreResult.data.score >= 60) {
    await email.run(ctx, { leadId: ctx.leadId });
  }

  return { leadId: ctx.leadId, score: scoreResult.data?.score };
}

export async function runDiscoverAndPipeline(
  organizationId: string,
  source: "GOOGLE_MAPS" | "LINKEDIN" | "WEBSITE_SCRAPE" | "DIRECTORY" | "SOCIAL",
  query: string
) {
  const finder = new LeadFinderAgent();
  const result = await finder.run(
    { organizationId },
    { source, query, limit: 5 }
  );

  for (const leadId of result.data?.leads ?? []) {
    await enqueueWorkflow({
      type: "full_pipeline",
      organizationId,
      leadId,
    });
  }

  return result;
}

export async function runCloseAndOnboard(
  organizationId: string,
  leadId: string,
  amount: number
) {
  const ctx: AgentContext = { organizationId, leadId };
  const closing = new ClosingAgent();
  const closeResult = await closing.run(ctx, { leadId, amount });

  const deal = await prisma.deal.findFirst({
    where: { leadId, stage: "PAYMENT_PENDING" },
  });

  if (deal) {
    await prisma.deal.update({
      where: { id: deal.id },
      data: { stage: "WON", closedAt: new Date() },
    });
    const onboarding = new OnboardingAgent();
    await onboarding.run(ctx, { dealId: deal.id });
  }

  return closeResult;
}
