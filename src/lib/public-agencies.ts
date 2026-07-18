import "server-only";

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { publicListingQueryStatuses } from "@/lib/lifecycle";

export type PublicAgencyCardRecord = {
  id: string;
  slug: string;
  name: string;
  verifiedStatus: string | null;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  facebookUrl: string | null;
  telegramUrl: string | null;
  viberPhone: string | null;
  tiktokUrl: string | null;
  websiteUrl: string | null;
  listingCount: number;
  coverageLabel: string | null;
  locationTokens: string[];
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

type VendorRow = {
  id: string;
  name: string;
  slug: string;
  is_suspended: boolean | null;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  facebook_url: string | null;
  telegram_url: string | null;
  viber_phone: string | null;
  tiktok_url: string | null;
  website_url: string | null;
  verified_status: string | null;
};

function buildCoverageLabel(parts: string[]) {
  const clean = parts.filter(Boolean);
  if (!clean.length) return null;
  return clean.slice(0, 2).join(" • ");
}

export const getPublicAgencies = cache(async (): Promise<PublicAgencyCardRecord[]> => {
  if (!isConfigured) {
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: vendorRows, error: vendorError } = await supabase
    .from("vendors")
    .select(
      "id,name,slug,is_suspended,tagline,description,logo_url,contact_phone,contact_email,facebook_url,telegram_url,viber_phone,tiktok_url,website_url,verified_status:verification_status"
    )
    .eq("public_storefront_enabled", true)
    .eq("is_suspended", false)
    .not("slug", "is", null)
    .order("name", { ascending: true });

  if (vendorError || !vendorRows?.length) {
    return [];
  }

  const safeVendors = (vendorRows as VendorRow[]).filter(
    (vendor) => vendor.id && vendor.name && vendor.slug && vendor.slug.trim()
  );

  if (!safeVendors.length) {
    return [];
  }

  const vendorIds = safeVendors.map((vendor) => vendor.id);

  const { data: membershipRows } = await supabase
    .from("vendor_members")
    .select("vendor_id,user_id")
    .in("vendor_id", vendorIds)
    .eq("status", "active");

  const memberIdsByVendor = new Map<string, string[]>();
  const vendorIdByMemberId = new Map<string, string>();

  for (const row of membershipRows ?? []) {
    const vendorId = String(row.vendor_id ?? "");
    const userId = String(row.user_id ?? "");
    if (!vendorId || !userId) continue;
    const bucket = memberIdsByVendor.get(vendorId) ?? [];
    bucket.push(userId);
    memberIdsByVendor.set(vendorId, bucket);
    vendorIdByMemberId.set(userId, vendorId);
  }

  const memberIds = Array.from(vendorIdByMemberId.keys());
  const listingCountByVendor = new Map<string, number>();
  const coverageByVendor = new Map<string, string[]>();

  if (memberIds.length) {
    const { data: propertyRows } = await supabase
      .from("properties")
      .select("created_by,township,district,state_region,status,moderation_status,is_deleted")
      .in("created_by", memberIds)
      .in("status", publicListingQueryStatuses)
      .eq("moderation_status", "visible")
      .eq("is_deleted", false);

    for (const row of propertyRows ?? []) {
      const memberId = String(row.created_by ?? "");
      const vendorId = vendorIdByMemberId.get(memberId);
      if (!vendorId) continue;

      listingCountByVendor.set(vendorId, (listingCountByVendor.get(vendorId) ?? 0) + 1);

      const coverage = coverageByVendor.get(vendorId) ?? [];
      for (const field of [row.township, row.district, row.state_region]) {
        const value = String(field ?? "").trim();
        if (value && !coverage.includes(value)) {
          coverage.push(value);
        }
      }
      coverageByVendor.set(vendorId, coverage);
    }
  }

  return safeVendors.map((vendor) => {
    const coverageParts = coverageByVendor.get(vendor.id) ?? [];
    return {
      id: vendor.id,
      slug: vendor.slug.trim(),
      name: vendor.name,
      verifiedStatus: vendor.verified_status ?? null,
      tagline: vendor.tagline?.trim() || null,
      description: vendor.description?.trim() || null,
      logoUrl: vendor.logo_url?.trim() || null,
      contactPhone: vendor.contact_phone?.trim() || null,
      contactEmail: vendor.contact_email?.trim() || null,
      facebookUrl: vendor.facebook_url?.trim() || null,
      telegramUrl: vendor.telegram_url?.trim() || null,
      viberPhone: vendor.viber_phone?.trim() || null,
      tiktokUrl: vendor.tiktok_url?.trim() || null,
      websiteUrl: vendor.website_url?.trim() || null,
      listingCount: listingCountByVendor.get(vendor.id) ?? 0,
      coverageLabel: buildCoverageLabel(coverageParts),
      locationTokens: coverageParts,
    };
  });
});
