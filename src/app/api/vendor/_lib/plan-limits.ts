import { getPlanUsageSummary } from "@/lib/vendor-plans";
import type { VendorRequestContext } from "@/app/api/vendor/_lib/context";

export async function getVendorPlanUsage(context: VendorRequestContext) {
  const { supabase, memberIds, vendor } = context;

  let propertyCount = 0;

  if (memberIds.length) {
    const { count: propertyCountRaw } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .in("created_by", memberIds)
      .eq("is_deleted", false);
    propertyCount = propertyCountRaw ?? 0;
  }

  const salesRequestCount = 0;
  const listingCount = propertyCount;
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
