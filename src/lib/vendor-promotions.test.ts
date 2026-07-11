import { describe, expect, it } from "vitest";

import {
  calculatePromotionEndsAt,
  getSearchRankingPromotionBonus,
  isPromotionActiveNow,
  isPromotionListingStatusEligible,
  normalizePromotionStatus,
  normalizePromotionTargetType,
  normalizePromotionType,
  resolvePromotionTargetType,
  selectActiveBoostedListingPromotions,
  selectActiveHeroPromotions,
  type PromotionRecordLike,
} from "@/lib/vendor-promotions";

const NOW = new Date("2026-01-15T12:00:00.000Z");

function createPromotion(overrides: Partial<PromotionRecordLike> = {}): PromotionRecordLike {
  return {
    id: overrides.id ?? "promo-1",
    vendor_id: overrides.vendor_id ?? "vendor-1",
    listing_id: overrides.listing_id ?? null,
    promotion_type: overrides.promotion_type ?? "hero_ad",
    target_type: Object.prototype.hasOwnProperty.call(overrides, "target_type")
      ? (overrides.target_type ?? null)
      : "agency_profile",
    status: overrides.status ?? "active",
    title: overrides.title ?? "Title",
    description: overrides.description ?? "Description",
    target_url: overrides.target_url ?? null,
    price_per_24h: overrides.price_per_24h ?? 1000,
    starts_at: overrides.starts_at ?? "2026-01-15T09:00:00.000Z",
    ends_at: overrides.ends_at ?? "2026-01-16T09:00:00.000Z",
  };
}

describe("vendor promotion helpers", () => {
  it("accepts only active listings as promotion-eligible", () => {
    expect(isPromotionListingStatusEligible("active")).toBe(true);
    expect(isPromotionListingStatusEligible("published")).toBe(true);
    expect(isPromotionListingStatusEligible("reserved")).toBe(false);
  });

  it("normalizes promotion metadata safely", () => {
    expect(normalizePromotionType(" HERO_AD ")).toBe("hero_ad");
    expect(normalizePromotionStatus("pending_payment")).toBe("pending_payment");
    expect(normalizePromotionTargetType("LISTING")).toBe("listing");
    expect(normalizePromotionType("unknown")).toBeNull();
  });

  it("resolves target type from explicit value or listing fallback", () => {
    expect(resolvePromotionTargetType(createPromotion({ target_type: "listing" }))).toBe("listing");
    expect(resolvePromotionTargetType(createPromotion({ target_type: null, listing_id: "listing-1" }))).toBe("listing");
    expect(resolvePromotionTargetType(createPromotion({ target_type: null, listing_id: null }))).toBe("agency_profile");
  });

  it("calculates promotion end timestamps and rejects invalid input", () => {
    expect(calculatePromotionEndsAt("2026-01-15T12:00:00.000Z", 24)).toBe("2026-01-16T12:00:00.000Z");
    expect(calculatePromotionEndsAt("not-a-date", 24)).toBeNull();
    expect(calculatePromotionEndsAt("2026-01-15T12:00:00.000Z", 0)).toBeNull();
  });

  it("treats only active promotions inside the time window as active", () => {
    expect(isPromotionActiveNow(createPromotion(), NOW)).toBe(true);
    expect(isPromotionActiveNow(createPromotion({ status: "paused" }), NOW)).toBe(false);
    expect(isPromotionActiveNow(createPromotion({ starts_at: "2026-01-15T13:00:00.000Z" }), NOW)).toBe(false);
    expect(isPromotionActiveNow(createPromotion({ ends_at: "2026-01-15T11:59:00.000Z" }), NOW)).toBe(false);
  });

  it("selects hero promotions by active status, price priority, and limit", () => {
    const items = [
      createPromotion({ id: "hero-low", price_per_24h: 1000, starts_at: "2026-01-15T10:00:00.000Z" }),
      createPromotion({ id: "hero-high", price_per_24h: 3000, starts_at: "2026-01-15T11:00:00.000Z" }),
      createPromotion({ id: "hero-tie-early", price_per_24h: 3000, starts_at: "2026-01-15T09:00:00.000Z" }),
      createPromotion({ id: "boosted", promotion_type: "listing_boost", listing_id: "listing-1", target_type: "listing" }),
      createPromotion({ id: "hero-paused", status: "paused" }),
    ];

    expect(selectActiveHeroPromotions(items, NOW, 2).map((item) => item.id)).toEqual(["hero-tie-early", "hero-high"]);
  });

  it("selects boosted listing promotions independently from hero promotions", () => {
    const items = [
      createPromotion({ id: "boost-1", promotion_type: "listing_boost", target_type: "listing", listing_id: "listing-1" }),
      createPromotion({ id: "hero-1", promotion_type: "hero_ad" }),
      createPromotion({ id: "boost-2", promotion_type: "listing_boost", target_type: "listing", listing_id: "listing-2", price_per_24h: 2000 }),
    ];

    expect(selectActiveBoostedListingPromotions(items, NOW).map((item) => item.id)).toEqual(["boost-2", "boost-1"]);
  });

  it("applies the search ranking bonus only for active matching promotions", () => {
    const items = [
      createPromotion({
        id: "search-match",
        promotion_type: "search_ranking",
        target_type: "listing",
        listing_id: "listing-42",
      }),
      createPromotion({
        id: "search-other",
        promotion_type: "search_ranking",
        target_type: "listing",
        listing_id: "listing-43",
      }),
    ];

    expect(getSearchRankingPromotionBonus(items, "listing-42", NOW)).toBe(1);
    expect(getSearchRankingPromotionBonus(items, "listing-missing", NOW)).toBe(0);
    expect(
      getSearchRankingPromotionBonus(
        [createPromotion({ promotion_type: "search_ranking", listing_id: "listing-42", status: "paused" })],
        "listing-42",
        NOW
      )
    ).toBe(0);
  });
});
