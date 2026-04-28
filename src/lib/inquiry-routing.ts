export type RoutedVendorCandidate = {
  vendorId: string;
  vendorName: string;
  plan: string | null;
  billingStatus: string | null;
  memberIds: string[];
};

export type InquiryRoutingInput = {
  dealType: "buy" | "rent";
  propertyType: string;
  stateRegion: string;
  district: string | null;
  township: string | null;
};

type VendorPropertyRow = {
  created_by: string | null;
  state_region: string | null;
  district: string | null;
  township: string | null;
};

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getPlanWeight(plan: string | null | undefined) {
  if (plan === "verified") return 4;
  if (plan === "growth") return 3;
  if (plan === "pro") return 2;
  return 1;
}

function scorePropertyMatch(input: InquiryRoutingInput, property: VendorPropertyRow) {
  let score = 0;
  if (normalize(property.state_region) === normalize(input.stateRegion)) score += 4;
  if (normalize(property.district) && normalize(property.district) === normalize(input.district)) score += 2;
  if (normalize(property.township) && normalize(property.township) === normalize(input.township)) score += 3;
  return score;
}

export function getInquiryDealAsPropertyDeal(dealType: "buy" | "rent") {
  return dealType === "buy" ? "sale" : "rent";
}

export function pickVendorForInquiry(
  input: InquiryRoutingInput,
  vendors: RoutedVendorCandidate[],
  properties: VendorPropertyRow[]
) {
  const ranked = vendors
    .map((vendor) => {
      const vendorProperties = properties.filter((property) => vendor.memberIds.includes(String(property.created_by ?? "")));
      const bestPropertyScore = vendorProperties.reduce(
        (best, property) => Math.max(best, scorePropertyMatch(input, property)),
        0
      );

      return {
        vendor,
        routingScore: bestPropertyScore,
        propertyCount: vendorProperties.length,
        planWeight: getPlanWeight(vendor.plan),
      };
    })
    .filter((entry) => entry.propertyCount > 0)
    .sort((left, right) => {
      if (right.routingScore !== left.routingScore) return right.routingScore - left.routingScore;
      if (right.planWeight !== left.planWeight) return right.planWeight - left.planWeight;
      if (right.propertyCount !== left.propertyCount) return right.propertyCount - left.propertyCount;
      return left.vendor.vendorName.localeCompare(right.vendor.vendorName);
    });

  return ranked[0] ?? null;
}
