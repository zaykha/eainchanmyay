import burmeseKeywords from "@/lib/moderation/burmese-keywords.json";

const bannedWordPatterns = [
  /\b(?:fuck|fucking|motherfucker|shit|bullshit|bitch|asshole|cunt)\b/i,
  /\b(?:escort|prostitut(?:e|ion)|brothel|hooker)\b/i,
];

const bannedPhrasePatterns = [
  /\b(?:drug|drugs|weed|cocaine|heroin|meth|methamphetamine|mdma|ecstasy|ketamine)\b.{0,24}\b(?:for sale|available|delivery|sell|selling|supply)\b/i,
  /\b(?:sell|selling|supply|available|delivery)\b.{0,24}\b(?:drug|drugs|weed|cocaine|heroin|meth|methamphetamine|mdma|ecstasy|ketamine)\b/i,
  /\b(?:buy|order|get)\b.{0,16}\b(?:weed|cocaine|heroin|meth|mdma|ecstasy|ketamine)\b/i,
  /\b(?:sell|selling|supply|available|delivery|buy|order|get)\b.{0,24}\b(?:ecstasy|extasy|estasy|keta|ketamine|k)\b/i,
  /\b(?:ecstasy|extasy|estasy|keta|ketamine|k)\b.{0,24}\b(?:for sale|available|delivery|sell|selling|supply)\b/i,
];

const spamPatterns = [
  /(https?:\/\/|www\.)\S+/i,
  /(?:\+?\d[\d\s\-()]{7,}\d.*){3,}/,
];

const suspiciousDrugAliasPatterns = [
  /\b(?:ecstasy|extasy|estasy)\b/i,
  /\b(?:keta|ketamine)\b/i,
  /\bsell\s+k\b/i,
  /\bk\s+(?:for sale|available|delivery)\b/i,
];

function normalizeInput(value: string | null | undefined) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s/+.-]/gu, " ")
    .trim();
}

type ModerationCategory = {
  blocked_terms: string[];
  blocked_phrases: string[];
  suspicious_terms: string[];
};

type ModerationKeywordDataset = {
  version: number;
  locale: string;
  categories: Record<string, ModerationCategory>;
};

function normalizeKeyword(value: string) {
  return normalizeInput(value);
}

function collectKeywordSet(
  categoryKey: keyof ModerationKeywordDataset["categories"],
  field: keyof ModerationCategory
) {
  const category = (burmeseKeywords as ModerationKeywordDataset).categories[categoryKey];
  return new Set(category[field].map(normalizeKeyword).filter(Boolean));
}

const blockedTermSet = new Set([
  ...Array.from(collectKeywordSet("drugs", "blocked_terms")),
  ...Array.from(collectKeywordSet("sex_services", "blocked_terms")),
  ...Array.from(collectKeywordSet("gambling", "blocked_terms")),
  ...Array.from(collectKeywordSet("scam_spam", "blocked_terms")),
]);

const blockedPhraseSet = new Set([
  ...Array.from(collectKeywordSet("drugs", "blocked_phrases")),
  ...Array.from(collectKeywordSet("sex_services", "blocked_phrases")),
  ...Array.from(collectKeywordSet("gambling", "blocked_phrases")),
  ...Array.from(collectKeywordSet("scam_spam", "blocked_phrases")),
]);

const suspiciousTermSet = new Set([
  ...Array.from(collectKeywordSet("drugs", "suspicious_terms")),
  ...Array.from(collectKeywordSet("sex_services", "suspicious_terms")),
  ...Array.from(collectKeywordSet("gambling", "suspicious_terms")),
  ...Array.from(collectKeywordSet("scam_spam", "suspicious_terms")),
]);

export type ModerationResult = {
  blocked: boolean;
  message: string | null;
  reasons: string[];
};

export function moderateListingText(input: {
  title?: string | null;
  description?: string | null;
}): ModerationResult {
  const title = normalizeInput(input.title);
  const description = normalizeInput(input.description);
  const combined = `${title}\n${description}`.trim();

  if (!combined) {
    return { blocked: false, message: null, reasons: [] };
  }

  const reasons: string[] = [];

  if (bannedWordPatterns.some((pattern) => pattern.test(combined))) {
    reasons.push("profanity_or_explicit_terms");
  }

  if (bannedPhrasePatterns.some((pattern) => pattern.test(combined))) {
    reasons.push("illegal_goods_or_services");
  }

  if (spamPatterns.some((pattern) => pattern.test(combined))) {
    reasons.push("spam_or_external_contact_spam");
  }

  if (suspiciousDrugAliasPatterns.some((pattern) => pattern.test(combined))) {
    reasons.push("drug_alias_match");
  }

  if (Array.from(blockedTermSet).some((term) => combined.includes(term))) {
    reasons.push("blocked_keyword_match");
  }

  if (Array.from(blockedPhraseSet).some((phrase) => combined.includes(phrase))) {
    reasons.push("blocked_phrase_match");
  }

  if (!reasons.length) {
    return { blocked: false, message: null, reasons: [] };
  }

  return {
    blocked: true,
    message:
      "Your title or description contains prohibited or suspicious wording. Remove profanity, drug-sale language, or spam/contact promotion and try again.",
    reasons,
  };
}

export function detectSuspiciousListingText(input: {
  title?: string | null;
  description?: string | null;
}) {
  const title = normalizeInput(input.title);
  const description = normalizeInput(input.description);
  const combined = `${title}\n${description}`.trim();

  if (!combined) return [];

  return Array.from(suspiciousTermSet).filter((term) => combined.includes(term));
}
