import { prisma, type LeadSource } from "@sales-agent/database";
import type { AgentContext, AgentResult, LeadCandidate } from "@sales-agent/shared";
import { BaseAgent } from "./base.js";
import {
  buildPlacesTextQuery,
  geocodeLocation,
  searchGooglePlaces,
  shouldUseGooglePlacesMock,
} from "../services/googlePlaces.js";

export interface LeadFinderInput {
  source: LeadSource;
  query: string;
  location?: string;
  industry?: string;
  limit?: number;
}

export class LeadFinderAgent extends BaseAgent<LeadFinderInput, { leads: string[] }> {
  readonly type = "LEAD_FINDER" as const;

  protected async execute(
    ctx: AgentContext,
    input: LeadFinderInput
  ): Promise<AgentResult<{ leads: string[] }>> {
    const candidates = await this.discover(input);
    const created: string[] = [];
    let skipped = 0;

    for (const c of candidates.slice(0, input.limit ?? 20)) {
      const placeId = c.metadata?.googlePlaceId as string | undefined;
      if (placeId) {
        const dup = await prisma.lead.findFirst({
          where: {
            organizationId: ctx.organizationId,
            metadata: { path: ["googlePlaceId"], equals: placeId },
          },
        });
        if (dup) {
          skipped++;
          continue;
        }
      }

      const lead = await prisma.lead.create({
        data: {
          organizationId: ctx.organizationId,
          source: input.source,
          companyName: c.companyName,
          website: c.website,
          email: c.email,
          phone: c.phone,
          industry: c.industry ?? input.industry,
          employeeCount: c.employeeCount,
          location: c.location ?? input.location,
          metadata: (c.metadata ?? {}) as object,
          status: "NEW",
        },
      });

      if (c.contacts?.length) {
        await prisma.contact.createMany({
          data: c.contacts.map((contact, i) => ({
            leadId: lead.id,
            name: contact.name,
            title: contact.title,
            email: contact.email,
            phone: contact.phone,
            linkedin: contact.linkedin,
            isPrimary: i === 0,
          })),
        });
      }

      created.push(lead.id);
    }

    return {
      success: true,
      data: { leads: created },
      metrics: {
        discovered: candidates.length,
        saved: created.length,
        skippedDuplicates: skipped,
      },
    };
  }

  private async discover(input: LeadFinderInput): Promise<LeadCandidate[]> {
    switch (input.source) {
      case "GOOGLE_MAPS":
        return this.searchGoogleMaps(input);
      case "LINKEDIN":
        return this.searchLinkedIn(input);
      case "WEBSITE_SCRAPE":
      case "DIRECTORY":
      case "SOCIAL":
        return this.searchGeneric(input);
      default:
        return this.searchGeneric(input);
    }
  }

  private async searchGoogleMaps(
    input: LeadFinderInput
  ): Promise<LeadCandidate[]> {
    if (shouldUseGooglePlacesMock()) {
      console.warn(
        "[LeadFinder] GOOGLE_MAPS_API_KEY not set (or GOOGLE_PLACES_USE_MOCK=true) — using mock data"
      );
      return this.mockCandidates(input, "google_maps");
    }

    const textQuery = buildPlacesTextQuery(input.query, input.location);
    const maxResults = Math.min(input.limit ?? 10, 20);

    let locationBias: { latitude: number; longitude: number } | undefined;
    if (input.location) {
      const geo = await geocodeLocation(input.location);
      if (geo) locationBias = geo;
    }

    const places = await searchGooglePlaces({
      textQuery,
      maxResults,
      locationBias,
    });

    return places.map((p) => ({
      companyName: p.companyName,
      website: p.website,
      phone: p.phone,
      industry: p.industry ?? input.industry,
      location: p.address || input.location,
      source: "google_maps",
      metadata: {
        googlePlaceId: p.placeId,
        googleMapsUri: p.googleMapsUri,
        placeTypes: p.types,
        businessStatus: p.businessStatus,
        searchQuery: textQuery,
        dataSource: "google_places_api",
      },
    }));
  }

  private async searchLinkedIn(
    input: LeadFinderInput
  ): Promise<LeadCandidate[]> {
    if (!process.env.LINKEDIN_CLIENT_ID) {
      return this.mockCandidates(input, "linkedin");
    }
    return this.mockCandidates(input, "linkedin");
  }

  private async searchGeneric(
    input: LeadFinderInput
  ): Promise<LeadCandidate[]> {
    return this.mockCandidates(input, input.source.toLowerCase());
  }

  private mockCandidates(
    input: LeadFinderInput,
    sourceLabel: string
  ): LeadCandidate[] {
    const base = input.query.replace(/\s+/g, " ").trim();
    return Array.from({ length: Math.min(input.limit ?? 5, 5) }, (_, i) => ({
      companyName: `${base} Business ${i + 1}`,
      website: `https://example-${sourceLabel}-${i + 1}.com`,
      email: `contact${i + 1}@example-${sourceLabel}.com`,
      phone: `+1555000${1000 + i}`,
      industry: input.industry ?? "professional services",
      employeeCount: 15 + i * 10,
      location: input.location ?? "United States",
      source: sourceLabel,
      metadata: { dataSource: "mock" },
      contacts: [
        {
          name: `Alex Manager ${i + 1}`,
          title: "Operations Manager",
          email: `alex${i + 1}@example-${sourceLabel}.com`,
        },
      ],
    }));
  }
}
