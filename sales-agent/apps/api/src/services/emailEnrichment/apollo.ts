import { extractDomain } from "./utils.js";
import type { EnrichmentResult } from "./types.js";

const APOLLO_BASE = "https://api.apollo.io/api/v1";

const DECISION_MAKER_TITLES = [
  "owner",
  "founder",
  "co-founder",
  "ceo",
  "president",
  "general manager",
  "operations manager",
  "office manager",
  "director",
  "vp",
  "head",
];

export function isApolloConfigured(): boolean {
  return Boolean(process.env.APOLLO_API_KEY?.trim());
}

export async function enrichEmailFromApollo(
  companyName: string,
  website?: string | null
): Promise<EnrichmentResult | null> {
  const apiKey = process.env.APOLLO_API_KEY?.trim();
  if (!apiKey) return null;

  const domain = extractDomain(website);
  if (!domain) return null;

  const person = await searchApolloPerson(apiKey, domain, companyName);
  if (person?.email) {
    return {
      email: person.email,
      contactName: person.name,
      contactTitle: person.title,
      source: "apollo",
      confidence: person.email_status === "verified" ? "high" : "medium",
      metadata: {
        apolloPersonId: person.id,
        apolloDomain: domain,
      },
    };
  }

  const orgEmail = await enrichApolloOrganization(apiKey, domain);
  if (orgEmail) {
    return {
      email: orgEmail,
      contactName: `${companyName} Team`,
      source: "apollo",
      confidence: "medium",
      metadata: { apolloDomain: domain, apolloType: "organization" },
    };
  }

  return null;
}

interface ApolloPersonHit {
  id?: string;
  name?: string;
  title?: string;
  email?: string;
  email_status?: string;
}

async function searchApolloPerson(
  apiKey: string,
  domain: string,
  companyName: string
): Promise<ApolloPersonHit | null> {
  const res = await fetch(`${APOLLO_BASE}/mixed_people/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      q_organization_domains: domain,
      q_organization_name: companyName,
      person_titles: DECISION_MAKER_TITLES,
      contact_email_status: ["verified", "guessed", "unavailable"],
      page: 1,
      per_page: 5,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn(`[Apollo] people search ${res.status}: ${err.slice(0, 120)}`);
    return null;
  }

  const data = (await res.json()) as {
    people?: ApolloPersonHit[];
  };

  const people = data.people ?? [];
  const withEmail = people.find((p) => p.email && p.email.includes("@"));
  return withEmail ?? null;
}

async function enrichApolloOrganization(
  apiKey: string,
  domain: string
): Promise<string | null> {
  const url = new URL(`${APOLLO_BASE}/organizations/enrich`);
  url.searchParams.set("domain", domain);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    organization?: {
      primary_email?: string;
      corporate_phone?: string;
    };
  };

  const email = data.organization?.primary_email;
  if (email && email.includes("@")) return email.toLowerCase();
  return null;
}
