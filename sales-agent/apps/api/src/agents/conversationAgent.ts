import { prisma } from "@sales-agent/database";
import type { AgentContext, AgentResult } from "@sales-agent/shared";
import { BaseAgent } from "./base.js";
import { complete } from "../services/llm.js";
import { PROMPTS, OBJECTION_RESPONSES } from "../prompts/index.js";

export class ConversationAgent extends BaseAgent<
  { conversationId: string; userMessage: string },
  { reply: string; intent: string; suggestedAction: string }
> {
  readonly type = "CONVERSATION" as const;

  protected async execute(
    ctx: AgentContext,
    input: { conversationId: string; userMessage: string }
  ): Promise<
    AgentResult<{ reply: string; intent: string; suggestedAction: string }>
  > {
    const conversation = await prisma.conversation.findUniqueOrThrow({
      where: { id: input.conversationId },
      include: {
        lead: { include: { playbook: true, research: true } },
        messages: { orderBy: { createdAt: "asc" }, take: 20 },
      },
    });

    const objectionKey = this.detectObjection(input.userMessage);
    if (objectionKey && OBJECTION_RESPONSES[objectionKey]) {
      const canned = OBJECTION_RESPONSES[objectionKey];
      await this.saveTurn(conversation.id, input.userMessage, canned, "objection");
      return {
        success: true,
        data: {
          reply: canned,
          intent: "objection",
          suggestedAction: "none",
        },
      };
    }

    const playbook = conversation.lead.playbook;
    const memory = conversation.messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const raw = await complete([
      { role: "system", content: "Output valid JSON only." },
      {
        role: "user",
        content: PROMPTS.conversationReply({
          playbook: playbook?.productSummary ?? "AI automation for SMBs",
          memory,
          userMessage: input.userMessage,
          pricingTiers: JSON.stringify(playbook?.pricingTiers ?? []),
          negotiationLimits: JSON.stringify(
            playbook?.negotiationMax ?? { maxDiscountPercent: 15 }
          ),
        }),
      },
    ]);

    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "")) as {
      reply: string;
      intent: string;
      suggestedAction: string;
    };

    await this.saveTurn(
      conversation.id,
      input.userMessage,
      parsed.reply,
      parsed.intent
    );

    if (parsed.suggestedAction === "book_meeting") {
      await prisma.lead.update({
        where: { id: conversation.leadId },
        data: { status: "ENGAGED" },
      });
    }

    return { success: true, data: parsed };
  }

  private detectObjection(message: string): string | null {
    const lower = message.toLowerCase();
    if (/too expensive|can't afford|price/.test(lower)) return "too_expensive";
    if (/think about|get back|later/.test(lower)) return "need_to_think";
    if (/already use|competitor|vendor/.test(lower)) return "using_competitor";
    if (/not interested|stop|unsubscribe/.test(lower)) return "not_interested";
    if (/no budget/.test(lower)) return "no_budget";
    if (/not the decision|wrong person|my boss/.test(lower))
      return "not_decision_maker";
    return null;
  }

  private async saveTurn(
    conversationId: string,
    userMsg: string,
    reply: string,
    intent: string
  ) {
    await prisma.conversationMessage.createMany({
      data: [
        { conversationId, role: "USER", content: userMsg },
        { conversationId, role: "ASSISTANT", content: reply, metadata: { intent } },
      ],
    });
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { intent, updatedAt: new Date() },
    });
  }
}
