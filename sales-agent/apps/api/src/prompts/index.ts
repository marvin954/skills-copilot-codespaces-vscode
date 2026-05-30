export const PROMPTS = {
  researchLead: (ctx: {
    companyName: string;
    website?: string;
    industry?: string;
    productOffering: string;
  }) => `You are a B2B sales research analyst for SMB outreach.

Company: ${ctx.companyName}
Website: ${ctx.website ?? "unknown"}
Industry: ${ctx.industry ?? "unknown"}

We sell: ${ctx.productOffering}

Analyze this prospect for AI automation / call center / chatbot / lead gen services.
Return JSON only:
{
  "painSummary": "2-3 sentences on operational pain",
  "opportunitySummary": "2-3 sentences on automation opportunity",
  "salesAngle": "1 personalized hook for first touch",
  "estimatedValue": number (USD annual contract estimate),
  "competitorNotes": "brief competitive context",
  "personalizedPitch": "3-sentence email opener"
}`,

  scoreLead: (ctx: { companyName: string; signals: string }) =>
    `Given these lead signals, explain in one sentence why this SMB is a good or weak fit for AI automation services.\n\n${ctx.signals}`,

  emailOutreach: (ctx: {
    companyName: string;
    contactName?: string;
    salesAngle: string;
    productName: string;
  }) => `Write a short, ethical cold email (under 120 words) for a B2B SMB decision maker.

Company: ${ctx.companyName}
Contact: ${ctx.contactName ?? "there"}
Angle: ${ctx.salesAngle}
Product: ${ctx.productName}

Rules: no false claims, one clear CTA (15-min call), professional tone.
Return JSON: { "subject": "...", "body": "..." }`,

  conversationReply: (ctx: {
    playbook: string;
    memory: string;
    userMessage: string;
    pricingTiers: string;
    negotiationLimits: string;
  }) => `You are a helpful B2B sales assistant. Stay ethical and within limits.

Playbook: ${ctx.playbook}
Pricing: ${ctx.pricingTiers}
Negotiation limits: ${ctx.negotiationLimits}
Conversation memory: ${ctx.memory}

Prospect message: ${ctx.userMessage}

Handle objections persuasively but honestly. If buying intent is high, suggest booking a call or checkout.
Return JSON: { "reply": "...", "intent": "info|objection|pricing|buying|not_interested", "suggestedAction": "none|book_meeting|send_checkout|handoff_human" }`,

  objectionHandler: (objection: string, playbook: string) =>
    `Handle this sales objection ethically for B2B AI automation services.

Objection: ${objection}
Playbook context: ${playbook}

Return JSON: { "response": "...", "followUpQuestion": "..." }`,

  managerReport: (metrics: string) =>
    `You are a sales operations manager AI. Review these metrics and suggest 3-5 optimizations.

${metrics}

Return JSON: { "summary": "...", "recommendations": [{ "channel": "...", "action": "...", "reason": "...", "priority": "low|medium|high" }] }`,
};

export const OBJECTION_RESPONSES: Record<string, string> = {
  too_expensive:
    "I understand budget matters. Many SMBs start with a focused pilot ($2.5k) that pays back within 90 days through hours saved. Would a scoped assessment help you see ROI before a larger commitment?",
  need_to_think:
    "Absolutely — happy to send a one-page summary you can share internally. What would be most useful for your team to evaluate: case studies, pricing, or a technical overview?",
  using_competitor:
    "Makes sense to stick with what works. We often complement existing tools rather than rip-and-replace. Would it help to compare where AI voice/chat could fill gaps your current stack doesn't cover?",
  not_interested:
    "Thanks for being direct — I'll note that. If automation becomes a priority later, we're here. Mind if I check back in 6 months?",
  no_budget:
    "Understood. We offer phased implementations so you can start small. Would a free automation audit (no commitment) be worth 20 minutes if timing improves next quarter?",
  not_decision_maker:
    "Thanks for letting me know. Could you point me to whoever owns operations or customer experience? I'm happy to send a brief they can forward.",
};
