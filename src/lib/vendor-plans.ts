export type VendorPlanKey = "free" | "pro" | "growth" | "verified";

export type VendorPlanDefinition = {
  key: VendorPlanKey;
  name: string;
  priceLabel: string;
  monthlyPriceMmk: number;
  listingLimit: number;
  agentLimit: number;
  imageLimit: number;
  listingLimitLabel: string;
  agentLimitLabel: string;
  description: string;
  highlights: string[];
  requiresPayment: boolean;
  includedVerification: boolean;
};

export const VENDOR_PLANS: VendorPlanDefinition[] = [
  {
    key: "free",
    name: "Free",
    priceLabel: "0 MMK",
    monthlyPriceMmk: 0,
    listingLimit: 5,
    agentLimit: 1,
    imageLimit: 5,
    listingLimitLabel: "Up to 5 listings",
    agentLimitLabel: "1 agent",
    description: "For onboarding, testing, and early supply generation.",
    highlights: ["Basic vendor workspace", "Listing submissions", "Basic dashboard"],
    requiresPayment: false,
    includedVerification: false,
  },
  {
    key: "pro",
    name: "Pro",
    priceLabel: "120,000 MMK",
    monthlyPriceMmk: 120000,
    listingLimit: 30,
    agentLimit: 5,
    imageLimit: 12,
    listingLimitLabel: "Up to 30 listings",
    agentLimitLabel: "Up to 5 agents",
    description: "For agencies that need lead handling and core operations.",
    highlights: ["Lead inbox", "Viewing requests", "Basic analytics"],
    requiresPayment: true,
    includedVerification: false,
  },
  {
    key: "growth",
    name: "Growth",
    priceLabel: "300,000 MMK",
    monthlyPriceMmk: 300000,
    listingLimit: 100,
    agentLimit: 15,
    imageLimit: 12,
    listingLimitLabel: "Up to 100 listings",
    agentLimitLabel: "Up to 15 agents",
    description: "For agencies that need workflow control and CRM.",
    highlights: ["CRM pipeline", "Auto assignment", "SLA tracking"],
    requiresPayment: true,
    includedVerification: false,
  },
  {
    key: "verified",
    name: "Verified",
    priceLabel: "500,000 MMK",
    monthlyPriceMmk: 500000,
    listingLimit: 300,
    agentLimit: 20,
    imageLimit: 12,
    listingLimitLabel: "Up to 300 listings",
    agentLimitLabel: "20+ agents",
    description: "For premium agencies that need trust, branding, and scale.",
    highlights: ["Verification package included", "Branding page", "Market insights"],
    requiresPayment: true,
    includedVerification: true,
  },
];

export function getVendorPlan(plan: string | null | undefined) {
  return VENDOR_PLANS.find((item) => item.key === plan) ?? VENDOR_PLANS[0];
}

export function isVendorPlanKey(value: unknown): value is VendorPlanKey {
  return VENDOR_PLANS.some((item) => item.key === value);
}

export function getUpgradePlan(plan: string | null | undefined) {
  const currentIndex = VENDOR_PLANS.findIndex((item) => item.key === plan);
  if (currentIndex < 0) {
    return VENDOR_PLANS[1] ?? null;
  }
  return VENDOR_PLANS[currentIndex + 1] ?? null;
}

export function getPlanUsageSummary(
  plan: string | null | undefined,
  usage: {
    listingCount: number;
    agentCount: number;
  }
) {
  const currentPlan = getVendorPlan(plan);
  const listingLimit = currentPlan.listingLimit;
  const agentLimit = currentPlan.agentLimit;
  const listingUsage = usage.listingCount;
  const agentUsage = usage.agentCount;

  return {
    plan: currentPlan,
    listingLimit,
    listingUsage,
    listingRemaining: Math.max(0, listingLimit - listingUsage),
    agentLimit,
    agentUsage,
    agentRemaining: Math.max(0, agentLimit - agentUsage),
    listingNearLimit: listingUsage >= Math.max(1, listingLimit - 1),
    agentNearLimit: agentUsage >= Math.max(1, agentLimit - 1),
    listingOverLimit: listingUsage > listingLimit,
    agentOverLimit: agentUsage > agentLimit,
    suggestedUpgrade: getUpgradePlan(currentPlan.key),
  };
}
