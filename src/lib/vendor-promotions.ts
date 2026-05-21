import { normalizeListingStatus } from "@/lib/lifecycle";

export const promotionTypeValues = ["hero_ad", "search_ranking", "listing_boost"] as const;
export type PromotionType = (typeof promotionTypeValues)[number];

export const promotionTargetTypeValues = ["agency_profile", "listing"] as const;
export type PromotionTargetType = (typeof promotionTargetTypeValues)[number];

export const promotionStatusValues = [
  "draft",
  "pending_payment",
  "pending_activation",
  "active",
  "paused",
  "expired",
  "cancelled",
] as const;
export type PromotionStatus = (typeof promotionStatusValues)[number];

export const promotionDurationOptions = [
  { label: "24 hours", durationHours: 24 },
  { label: "3 days", durationHours: 72 },
  { label: "7 days", durationHours: 168 },
  { label: "30 days", durationHours: 720 },
] as const;

export const promotionProducts: Array<{
  type: PromotionType;
  label: string;
  description: string;
  targetTypes: PromotionTargetType[];
}> = [
  {
    type: "hero_ad",
    label: "Hero Section Ad",
    description: "Show your agency or selected listing in the rotating homepage hero area.",
    targetTypes: ["agency_profile", "listing"],
  },
  {
    type: "search_ranking",
    label: "Search / Filter Ranking",
    description: "Push one active listing higher when buyers search or filter matching properties.",
    targetTypes: ["listing"],
  },
  {
    type: "listing_boost",
    label: "Listing Boost",
    description: "Feature one active listing in boosted slots and give it extra visibility.",
    targetTypes: ["listing"],
  },
];

export type PromotionRecordLike = {
  id: string;
  listing_id?: string | null;
  promotion_type: string | null;
  target_type?: string | null;
  status: string | null;
  price_per_24h?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

export function isPromotionListingStatusEligible(status: string | null | undefined) {
  const normalized = normalizeListingStatus(status);
  return normalized === "active";
}

export function normalizePromotionType(value: string | null | undefined): PromotionType | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  return promotionTypeValues.find((item) => item === normalized) ?? null;
}

export function normalizePromotionTargetType(value: string | null | undefined): PromotionTargetType | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  return promotionTargetTypeValues.find((item) => item === normalized) ?? null;
}

export function resolvePromotionTargetType(
  promotion: Pick<PromotionRecordLike, "target_type" | "listing_id">
): PromotionTargetType {
  const explicit = normalizePromotionTargetType(promotion.target_type);
  if (explicit) return explicit;
  return promotion.listing_id ? "listing" : "agency_profile";
}

export function normalizePromotionStatus(value: string | null | undefined): PromotionStatus | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  return promotionStatusValues.find((item) => item === normalized) ?? null;
}

export function calculatePromotionEndsAt(startsAt: string, durationHours: number) {
  const start = new Date(startsAt);
  if (!Number.isFinite(start.getTime()) || durationHours <= 0) return null;
  return new Date(start.getTime() + durationHours * 60 * 60 * 1000).toISOString();
}

export function isPromotionActiveNow(
  promotion: Pick<PromotionRecordLike, "status" | "starts_at" | "ends_at">,
  now = new Date()
) {
  const status = normalizePromotionStatus(promotion.status);
  if (status !== "active") return false;
  const nowMs = now.getTime();
  const startsAtMs = promotion.starts_at ? new Date(promotion.starts_at).getTime() : Number.NaN;
  const endsAtMs = promotion.ends_at ? new Date(promotion.ends_at).getTime() : Number.NaN;
  if (!Number.isFinite(startsAtMs) || !Number.isFinite(endsAtMs)) return false;
  return startsAtMs <= nowMs && endsAtMs >= nowMs;
}

function compareMarketplacePriority(left: PromotionRecordLike, right: PromotionRecordLike) {
  const priceDiff = Number(right.price_per_24h ?? 0) - Number(left.price_per_24h ?? 0);
  if (priceDiff !== 0) return priceDiff;
  return new Date(left.starts_at ?? 0).getTime() - new Date(right.starts_at ?? 0).getTime();
}

export function selectActiveHeroPromotions(items: PromotionRecordLike[], now = new Date(), limit = 4) {
  return items
    .filter((item) => normalizePromotionType(item.promotion_type) === "hero_ad" && isPromotionActiveNow(item, now))
    .sort(compareMarketplacePriority)
    .slice(0, limit);
}

export function selectActiveBoostedListingPromotions(items: PromotionRecordLike[], now = new Date(), limit = 6) {
  return items
    .filter((item) => normalizePromotionType(item.promotion_type) === "listing_boost" && isPromotionActiveNow(item, now))
    .sort(compareMarketplacePriority)
    .slice(0, limit);
}

export function getSearchRankingPromotionBonus(items: PromotionRecordLike[], listingId: string, now = new Date()) {
  return items.some(
    (item) =>
      item.listing_id === listingId &&
      normalizePromotionType(item.promotion_type) === "search_ranking" &&
      isPromotionActiveNow(item, now)
  )
    ? 1
    : 0;
}
