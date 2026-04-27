import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

type PropertyLeadShape = {
  deal_type: string | null;
  property_type: string | null;
  state_region: string | null;
  district: string | null;
  township: string | null;
};

type InquiryLeadShape = {
  id: string;
  deal_type: string | null;
  property_type: string | null;
  state_region: string | null;
  district: string | null;
  township: string | null;
  budget_range: string | null;
  timeline: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  need_parking: boolean | null;
  need_lift: boolean | null;
  need_solar: boolean | null;
  need_generator: boolean | null;
  created_at: string | null;
};

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function compactRawValue(value: string | null | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

function mapInquiryDealToPropertyDeal(value: string | null | undefined) {
  return value === "buy" ? "sale" : value === "rent" ? "rent" : "";
}

function scoreInquiryMatch(inquiry: InquiryLeadShape, properties: PropertyLeadShape[]) {
  const propertyDeal = mapInquiryDealToPropertyDeal(inquiry.deal_type);
  const inquiryType = normalize(inquiry.property_type);
  const inquiryState = normalize(inquiry.state_region);
  const inquiryDistrict = normalize(inquiry.district);
  const inquiryTownship = normalize(inquiry.township);

  let bestScore = 0;

  for (const property of properties) {
    let score = 0;
    if (normalize(property.deal_type) && normalize(property.deal_type) === propertyDeal) score += 3;
    if (normalize(property.property_type) && normalize(property.property_type) === inquiryType) score += 3;
    if (normalize(property.state_region) && normalize(property.state_region) === inquiryState) score += 2;
    if (normalize(property.district) && normalize(property.district) === inquiryDistrict) score += 2;
    if (normalize(property.township) && normalize(property.township) === inquiryTownship) score += 2;
    bestScore = Math.max(bestScore, score);
  }

  return bestScore;
}

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, memberIds } = result.context;

  if (!memberIds.length) {
    return NextResponse.json({ items: [], matchingMode: "property_overlap" });
  }

  const { data: propertyRows, error: propertyError } = await supabase
    .from("properties")
    .select("deal_type,property_type,state_region,district,township")
    .in("created_by", memberIds)
    .eq("is_deleted", false)
    .eq("status", "published");

  if (propertyError) {
    return NextResponse.json({ error: propertyError.message }, { status: 500 });
  }

  const properties = (propertyRows ?? []) as PropertyLeadShape[];
  if (!properties.length) {
    return NextResponse.json({ items: [], matchingMode: "property_overlap" });
  }

  const allowedPropertyTypes = Array.from(
    new Set(properties.map((row) => compactRawValue(row.property_type)).filter(Boolean))
  );
  const allowedStates = Array.from(
    new Set(properties.map((row) => compactRawValue(row.state_region)).filter(Boolean))
  );

  let query = supabase
    .from("inquiries")
    .select(
      "id,deal_type,property_type,state_region,district,township,budget_range,timeline,bedrooms,bathrooms,area_sqft,need_parking,need_lift,need_solar,need_generator,created_at"
    )
    .order("created_at", { ascending: false });

  if (allowedPropertyTypes.length) {
    query = query.in("property_type", allowedPropertyTypes);
  }
  if (allowedStates.length) {
    query = query.in("state_region", allowedStates);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const inquiries = (data ?? []) as InquiryLeadShape[];

  const items = inquiries
    .map((inquiry) => ({
      ...inquiry,
      match_score: scoreInquiryMatch(inquiry, properties),
    }))
    .filter((inquiry) => inquiry.match_score >= 5)
    .sort((a, b) => {
      if (b.match_score !== a.match_score) return b.match_score - a.match_score;
      return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
    });

  return NextResponse.json({
    items,
    matchingMode: "property_overlap",
  });
}
