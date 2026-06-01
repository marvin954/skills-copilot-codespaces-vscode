import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PLAYBOOKS = [
  {
    slug: "ai-automation-services",
    name: "AI Automation Services",
    industry: "cross-industry",
    productSummary:
      "Custom AI workflows, integrations, and process automation for SMBs. Reduce manual work 40–70% with tailored automations.",
    pricingTiers: [
      { name: "Starter", price: 2500, period: "project" },
      { name: "Growth", price: 5000, period: "month" },
      { name: "Enterprise", price: 12000, period: "month" },
    ],
  },
  {
    slug: "ai-call-center",
    name: "AI Call Centers",
    industry: "customer-service",
    productSummary:
      "24/7 AI voice agents for inbound/outbound calls, appointment setting, and support — human-like, scalable.",
    pricingTiers: [
      { name: "Starter", price: 1500, period: "month" },
      { name: "Growth", price: 4000, period: "month" },
    ],
  },
  {
    slug: "ai-chatbots",
    name: "AI Chatbots",
    industry: "cross-industry",
    productSummary:
      "Website and SMS chatbots that qualify leads, answer FAQs, and book meetings automatically.",
    pricingTiers: [
      { name: "Starter", price: 999, period: "month" },
      { name: "Growth", price: 2499, period: "month" },
    ],
  },
  {
    slug: "lead-generation-systems",
    name: "Lead Generation Systems",
    industry: "b2b-services",
    productSummary:
      "Done-for-you outbound systems: list building, enrichment, multi-channel sequences, and CRM sync.",
    pricingTiers: [
      { name: "Growth", price: 3500, period: "month" },
      { name: "Scale", price: 7500, period: "month" },
    ],
  },
  {
    slug: "business-automation",
    name: "Business Automation Solutions",
    industry: "operations",
    productSummary:
      "End-to-end automation across sales, ops, and finance — CRM, billing, reporting, and AI assistants.",
    pricingTiers: [
      { name: "Assessment", price: 1500, period: "one-time" },
      { name: "Implementation", price: 8000, period: "project" },
    ],
  },
];

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      name: "AI Automation Sales",
      slug: "default",
      settings: {
        productName: "AI Automation Suite",
        targetIndustries: ["professional services", "healthcare", "logistics", "e-commerce"],
        targetEmployeeRange: [5, 200],
        maxDailyEmails: 500,
      },
    },
  });

  for (const pb of DEFAULT_PLAYBOOKS) {
    await prisma.playbook.upsert({
      where: {
        organizationId_slug: { organizationId: org.id, slug: pb.slug },
      },
      update: { productSummary: pb.productSummary, pricingTiers: pb.pricingTiers },
      create: {
        organizationId: org.id,
        slug: pb.slug,
        name: pb.name,
        industry: pb.industry,
        productSummary: pb.productSummary,
        pricingTiers: pb.pricingTiers,
        objectionRules: [],
        pitchAngles: [],
        negotiationMax: { maxDiscountPercent: 15, canOfferTrial: true },
      },
    });
  }

  console.log("Seeded organization:", org.slug);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
