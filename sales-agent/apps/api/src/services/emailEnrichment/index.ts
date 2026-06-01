import { prisma } from "@sales-agent/database";
import type { EnrichLeadInput, EnrichmentResult } from "./types.js";
import { enrichEmailFromWebsite } from "./websiteScraper.js";
import { enrichEmailFromApollo, isApolloConfigured } from "./apollo.js";

export * from "./types.js";
export { isApolloConfigured } from "./apollo.js";
export { isWebsiteScrapeEnabled } from "./websiteScraper.js";
export { extractDomain, extractEmailsFromText, pickBestEmail } from "./utils.js";

/**
 * Enrich a lead with a contact email:
 * 1. Website scrape (contact/about pages)
 * 2. Apollo.io (people search + org enrich)
 */
export async function enrichLeadEmail(
  input: EnrichLeadInput
): Promise<EnrichmentResult> {
  if (input.email?.includes("@")) {
    return {
      email: input.email,
      source: "existing",
      confidence: "high",
    };
  }

  let result: EnrichmentResult | null = null;

  if (input.website) {
    result = await enrichEmailFromWebsite(input.website, input.companyName);
  }

  if (!result?.email && isApolloConfigured()) {
    result = await enrichEmailFromApollo(input.companyName, input.website);
    if (result) {
      await apolloRateLimitDelay();
    }
  }

  if (!result?.email) {
    return { source: "none", confidence: "low" };
  }

  return result;
}

/** Persist enrichment on lead + primary contact. */
export async function applyEnrichmentToLead(
  leadId: string,
  enrichment: EnrichmentResult
): Promise<void> {
  if (!enrichment.email) return;

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  const metadata = {
    ...((lead.metadata as Record<string, unknown>) ?? {}),
    emailEnrichment: {
      source: enrichment.source,
      confidence: enrichment.confidence,
      at: new Date().toISOString(),
      ...enrichment.metadata,
    },
  };

  await prisma.lead.update({
    where: { id: leadId },
    data: { email: enrichment.email, metadata },
  });

  const existingContact = await prisma.contact.findFirst({
    where: { leadId, isPrimary: true },
  });

  if (existingContact) {
    await prisma.contact.update({
      where: { id: existingContact.id },
      data: {
        email: enrichment.email,
        name: enrichment.contactName ?? existingContact.name,
        title: enrichment.contactTitle ?? existingContact.title,
      },
    });
  } else {
    await prisma.contact.create({
      data: {
        leadId,
        name: enrichment.contactName ?? "Primary Contact",
        email: enrichment.email,
        title: enrichment.contactTitle,
        isPrimary: true,
      },
    });
  }
}

export async function enrichAndSaveLead(leadId: string): Promise<EnrichmentResult> {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
  const result = await enrichLeadEmail({
    leadId: lead.id,
    companyName: lead.companyName,
    website: lead.website,
    email: lead.email,
    phone: lead.phone,
    location: lead.location,
  });
  await applyEnrichmentToLead(leadId, result);
  return result;
}

export async function enrichLeadsBatch(
  leadIds: string[],
  options: { delayMs?: number } = {}
): Promise<{
  enriched: number;
  failed: number;
  results: Array<{ leadId: string; source: string; email?: string }>;
}> {
  const delayMs = options.delayMs ?? 500;
  let enriched = 0;
  let failed = 0;
  const results: Array<{ leadId: string; source: string; email?: string }> = [];

  for (const leadId of leadIds) {
    try {
      const result = await enrichAndSaveLead(leadId);
      if (result.email) enriched++;
      results.push({
        leadId,
        source: result.source,
        email: result.email,
      });
    } catch (err) {
      failed++;
      results.push({
        leadId,
        source: "error",
        email: err instanceof Error ? err.message : undefined,
      });
    }
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }

  return { enriched, failed, results };
}

function apolloRateLimitDelay(): Promise<void> {
  const ms = Number(process.env.APOLLO_RATE_LIMIT_MS ?? 300);
  return new Promise((r) => setTimeout(r, ms));
}
