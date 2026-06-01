export const AGENT_TYPES = [
  "LEAD_FINDER",
  "LEAD_RESEARCH",
  "LEAD_SCORING",
  "EMAIL",
  "SMS",
  "LINKEDIN",
  "VOICE",
  "CRM",
  "CLOSING",
  "ONBOARDING",
  "MANAGER",
  "CONVERSATION",
] as const;

export const WORKFLOW_STAGES = [
  "lead_found",
  "research_lead",
  "score_lead",
  "generate_pitch",
  "send_outreach",
  "handle_responses",
  "book_meeting_or_close",
  "collect_payment",
  "onboard_customer",
  "request_reviews",
  "upsell",
] as const;

export const OBJECTION_TYPES = [
  "too_expensive",
  "need_to_think",
  "using_competitor",
  "not_interested",
  "no_budget",
  "not_decision_maker",
] as const;

export const DEFAULT_TARGET_CRITERIA = {
  industries: [
    "professional services",
    "healthcare",
    "logistics",
    "e-commerce",
    "real estate",
    "home services",
    "automotive",
  ],
  employeeMin: 5,
  employeeMax: 200,
  locations: ["United States", "Canada", "United Kingdom"],
  keywords: [
    "automation",
    "customer service",
    "scheduling",
    "lead generation",
    "call center",
  ],
};

export const PRODUCT_OFFERING = {
  name: "AI Automation Suite",
  services: [
    "AI Automation Services",
    "AI Call Centers",
    "AI Chatbots",
    "Lead Generation Systems",
    "Business Automation Solutions",
  ],
  idealCustomer:
    "B2B SMBs (5–200 employees) seeking to automate sales, support, and operations with AI.",
};
