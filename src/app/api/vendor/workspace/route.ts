import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { getVendorPlanUsage } from "@/app/api/vendor/_lib/plan-limits";
import { normalizeStorefrontPayload } from "@/lib/vendor-storefront";

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request, { allowPendingBilling: true });
  if (!result.ok) {
    return result.response;
  }

  const { vendor, membership, profile } = result.context;
  const { propertyCount, salesRequestCount, planUsage } = await getVendorPlanUsage(result.context);

  return NextResponse.json({
    vendor,
    membership,
    profile: {
      full_name: profile.full_name,
      email: profile.email,
    },
    limits: {
      currentPlan: planUsage.plan,
      listingCount: planUsage.listingUsage,
      livePropertyCount: propertyCount,
      draftRequestCount: salesRequestCount,
      listingLimit: planUsage.listingLimit,
      listingRemaining: planUsage.listingRemaining,
      listingNearLimit: planUsage.listingNearLimit,
      listingOverLimit: planUsage.listingOverLimit,
      agentCount: planUsage.agentUsage,
      agentLimit: planUsage.agentLimit,
      agentRemaining: planUsage.agentRemaining,
      agentNearLimit: planUsage.agentNearLimit,
      agentOverLimit: planUsage.agentOverLimit,
      suggestedUpgrade: planUsage.suggestedUpgrade,
    },
  });
}

export async function PATCH(request: Request) {
  const result = await getVendorRequestContext(request, { allowPendingBilling: true });
  if (!result.ok) {
    return result.response;
  }

  if (!["owner", "admin"].includes(result.context.membership.role)) {
    return NextResponse.json({ error: "Only owners and admins can update storefront settings." }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const payload = normalizeStorefrontPayload(body);
  if (payload.slug !== undefined && !payload.slug) {
    return NextResponse.json({ error: "Storefront slug cannot be empty." }, { status: 400 });
  }

  const updates = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No storefront changes were provided." }, { status: 400 });
  }

  const { data: existingVendor, error: existingError } = await result.context.supabase
    .from("vendors")
    .select("id")
    .eq("id", result.context.vendor.id)
    .maybeSingle();

  if (existingError || !existingVendor?.id) {
    return NextResponse.json({ error: existingError?.message ?? "Vendor not found." }, { status: 404 });
  }

  if (typeof updates.slug === "string") {
    const { data: slugConflict, error: slugError } = await result.context.supabase
      .from("vendors")
      .select("id")
      .eq("slug", updates.slug)
      .neq("id", result.context.vendor.id)
      .maybeSingle();

    if (slugError) {
      return NextResponse.json({ error: slugError.message }, { status: 500 });
    }

    if (slugConflict?.id) {
      return NextResponse.json({ error: "That storefront slug is already in use." }, { status: 409 });
    }
  }

  const { error: updateError } = await result.context.supabase
    .from("vendors")
    .update(updates)
    .eq("id", result.context.vendor.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return GET(request);
}
