import { prisma, type AgentType, type AgentRunStatus } from "@sales-agent/database";
import type { AgentContext, AgentResult } from "@sales-agent/shared";

export abstract class BaseAgent<TInput = unknown, TOutput = unknown> {
  abstract readonly type: AgentType;

  async run(ctx: AgentContext, input: TInput): Promise<AgentResult<TOutput>> {
    const run = await prisma.agentRun.create({
      data: {
        organizationId: ctx.organizationId,
        agentType: this.type,
        status: "RUNNING",
        input: input as object,
        leadId: ctx.leadId,
        startedAt: new Date(),
      },
    });

    try {
      const result = await this.execute(ctx, input);
      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: "COMPLETED" as AgentRunStatus,
          output: (result.data ?? {}) as object,
          completedAt: new Date(),
        },
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          error: message,
          completedAt: new Date(),
        },
      });
      return { success: false, error: message };
    }
  }

  protected abstract execute(
    ctx: AgentContext,
    input: TInput
  ): Promise<AgentResult<TOutput>>;
}
