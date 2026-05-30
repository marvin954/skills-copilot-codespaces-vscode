const EMAIL_REGEX =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/g;

const BLOCKED_LOCAL_PARTS = new Set([
  "noreply",
  "no-reply",
  "donotreply",
  "mailer-daemon",
  "postmaster",
  "webmaster",
  "support",
  "help",
  "admin",
  "newsletter",
  "marketing",
  "privacy",
  "abuse",
  "bounce",
]);

const BLOCKED_DOMAINS = new Set([
  "example.com",
  "sentry.io",
  "wixpress.com",
  "domain.com",
  "email.com",
  "yourdomain.com",
]);

export function extractDomain(url?: string | null): string | null {
  if (!url?.trim()) return null;
  try {
    const withProto = url.startsWith("http") ? url : `https://${url}`;
    const host = new URL(withProto).hostname.toLowerCase();
    return host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function extractEmailsFromText(text: string): string[] {
  const matches = text.match(EMAIL_REGEX) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of matches) {
    const email = raw.toLowerCase().trim();
    if (seen.has(email)) continue;
    if (!isLikelyBusinessEmail(email)) continue;
    seen.add(email);
    out.push(email);
  }

  return out;
}

export function isLikelyBusinessEmail(email: string): boolean {
  const lower = email.toLowerCase();
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".gif")) {
    return false;
  }

  const [local, domain] = lower.split("@");
  if (!local || !domain) return false;
  if (BLOCKED_DOMAINS.has(domain)) return false;
  if (local.includes("example")) return false;
  if (BLOCKED_LOCAL_PARTS.has(local.split("+")[0])) return false;

  return true;
}

/** Prefer emails on the business domain; deprioritize generic inboxes. */
export function pickBestEmail(
  emails: string[],
  domain?: string | null
): { email: string; confidence: "high" | "medium" | "low" } | null {
  if (emails.length === 0) return null;

  const scored = emails.map((email) => {
    const lower = email.toLowerCase();
    const emailDomain = lower.split("@")[1];
    let score = 0;

    if (domain && emailDomain === domain) score += 50;
    if (domain && emailDomain?.endsWith(`.${domain}`)) score += 30;

    const local = lower.split("@")[0];
    if (/^(ceo|owner|founder|president|director|manager|ops)/.test(local)) {
      score += 15;
    }
    if (local === "info" || local === "contact" || local === "hello") {
      score += 5;
    }
    if (BLOCKED_LOCAL_PARTS.has(local)) score -= 40;

    return { email: lower, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score < 0) return null;

  const confidence: "high" | "medium" | "low" =
    best.score >= 50 ? "high" : best.score >= 15 ? "medium" : "low";

  return { email: best.email, confidence };
}

export { EMAIL_REGEX };
