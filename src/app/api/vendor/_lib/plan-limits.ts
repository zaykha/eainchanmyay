import { getPlanUsageSummary } from "@/lib/vendor-plans";
import type { VendorRequestContext } from "@/app/api/vendor/_lib/context";

export async function getVendorPlanUsage(context: VendorRequestContext) {
  const { supabase, memberIds, vendor } = context;

  let propertyCount = 0;
  let salesRequestCount = 0;

  if (memberIds.length) {
    const [{ count: propertyCountRaw }, { count: salesRequestCountRaw }] = await Promise.all([
      supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .in("created_by", memberIds)
        .eq("is_deleted", false),
      supabase
        .from("sales_requests")
        .select("id", { count: "exact", head: true })
        .in("user_id", memberIds),
    ]);

    propertyCount = propertyCountRaw ?? 0;
    salesRequestCount = salesRequestCountRaw ?? 0;
  }

  const listingCount = propertyCount + salesRequestCount;
  const agentCount = memberIds.length;
  const planUsage = getPlanUsageSummary(vendor.plan, {
    listingCount,
    agentCount,
  });

  return {
    propertyCount,
    salesRequestCount,
    listingCount,
    agentCount,
    planUsage,
  };
}
