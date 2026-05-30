import { extractDomain, extractEmailsFromText, pickBestEmail } from "./utils.js";
import type { EnrichmentResult } from "./types.js";

const CONTACT_PATHS = [
  "",
  "/contact",
  "/contact-us",
  "/contactus",
  "/about",
  "/about-us",
  "/team",
];

const FETCH_TIMEOUT_MS = 8_000;
const MAX_PAGES = 4;

export function isWebsiteScrapeEnabled(): boolean {
  return process.env.EMAIL_SCRAPE_ENABLED !== "false";
}

export async function enrichEmailFromWebsite(
  website: string,
  companyName: string
): Promise<EnrichmentResult | null> {
  if (!isWebsiteScrapeEnabled()) return null;

  const domain = extractDomain(website);
  if (!domain) return null;

  const baseUrl = website.startsWith("http") ? website : `https://${website}`;
  let origin: string;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return null;
  }

  const allEmails: string[] = [];
  const pagesFetched: string[] = [];

  for (const path of CONTACT_PATHS.slice(0, MAX_PAGES)) {
    const url = path ? `${origin}${path}` : origin;
    try {
      const html = await fetchPage(url);
      if (!html) continue;
      pagesFetched.push(path || "/");
      allEmails.push(...extractEmailsFromText(html));
    } catch {
      continue;
    }
  }

  const picked = pickBestEmail(allEmails, domain);
  if (!picked) return null;

  return {
    email: picked.email,
    contactName: inferNameFromEmail(picked.email, companyName),
    source: "website_scrape",
    confidence: picked.confidence,
    metadata: {
      enrichmentDomain: domain,
      pagesFetched,
      candidatesFound: allEmails.length,
    },
  };
}

async function fetchPage(url: string): Promise<string | null> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      "User-Agent":
        "SalesAgentEnrichment/1.0 (+https://example.com; B2B lead enrichment)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
    return null;
  }

  const html = await res.text();
  if (html.length > 500_000) return html.slice(0, 500_000);

  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

function inferNameFromEmail(email: string, companyName: string): string | undefined {
  const local = email.split("@")[0];
  if (!local || local.length < 2) return undefined;
  if (["info", "contact", "hello", "sales", "admin", "office"].includes(local)) {
    return `${companyName} Team`;
  }
  const parts = local.split(/[._-]/).filter((p) => p.length > 1);
  if (parts.length >= 2) {
    return parts
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  }
  return undefined;
}
