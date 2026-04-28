export type VendorStorefrontFields = {
  slug: string | null;
  tagline: string | null;
  description: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  strengths: string[];
  public_storefront_enabled: boolean;
  verified_status?: string | null;
};

function toOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function slugifyVendorSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function normalizeStorefrontStrengths(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => toOptionalString(item))
      .filter((item): item is string => Boolean(item))
      .slice(0, 8);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  return [] as string[];
}

export function normalizeStorefrontPayload(payload: Record<string, unknown>) {
  return {
    slug: payload.slug === undefined ? undefined : slugifyVendorSlug(String(payload.slug ?? "")) || null,
    tagline: payload.tagline === undefined ? undefined : toOptionalString(payload.tagline),
    description: payload.description === undefined ? undefined : toOptionalString(payload.description),
    contact_phone: payload.contact_phone === undefined ? undefined : toOptionalString(payload.contact_phone),
    contact_email: payload.contact_email === undefined ? undefined : toOptionalString(payload.contact_email),
    logo_url: payload.logo_url === undefined ? undefined : toOptionalString(payload.logo_url),
    cover_image_url: payload.cover_image_url === undefined ? undefined : toOptionalString(payload.cover_image_url),
    strengths: payload.strengths === undefined ? undefined : normalizeStorefrontStrengths(payload.strengths),
    public_storefront_enabled:
      payload.public_storefront_enabled === undefined ? undefined : Boolean(payload.public_storefront_enabled),
  };
}

export function getVendorStorefrontBadges(input: {
  plan?: string | null;
  verifiedStatus?: string | null;
  vendorType?: string | null;
}) {
  const badges: string[] = [];

  if (input.verifiedStatus === "approved") {
    badges.push("Verified agency");
  }

  if (input.plan && input.plan !== "free") {
    badges.push(`${input.plan.charAt(0).toUpperCase()}${input.plan.slice(1)} plan`);
  }

  if (input.vendorType) {
    badges.push(input.vendorType.replace(/_/g, " "));
  }

  return badges;
}
