import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { canManageBilling } from "@/lib/vendor-permissions";

import { createDingerPrebuiltCheckoutUrl } from "@/lib/dinger";
import { getBearerToken } from "@/lib/vendor-auth";
import { getVendorPlan, isVendorPlanKey } from "@/lib/vendor-plans";
import { isVendorStorefrontSetupComplete } from "@/lib/vendor-storefront";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const dingerClientId = process.env.DINGER_CLIENT_ID ?? "";
const dingerPublicKey = process.env.DINGER_PUBLIC_KEY ?? "";
const dingerMerchantKey = process.env.DINGER_MERCHANT_KEY ?? "";
const dingerProjectName = process.env.DINGER_PROJECT_NAME ?? "";
const dingerMerchantName = process.env.DINGER_MERCHANT_NAME ?? "";
const dingerBillingProvider = "dinger";

const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);
const isDingerConfigured = Boolean(
  dingerClientId && dingerPublicKey && dingerMerchantKey && dingerProjectName && dingerMerchantName
);
const isDevBypassBilling = process.env.NODE_ENV !== "production";

function getFallbackVendorName(email: string | null | undefined) {
  if (!email) return "My Vendor Workspace";
  const localPart = email.split("@")[0]?.trim() ?? "";
  return localPart ? `${localPart} Workspace` : "My Vendor Workspace";
}

function getRequestedVendorId(request: Request) {
  const headerValue = request.headers.get("x-vendor-id")?.trim();
  if (headerValue) return headerValue;
  const { searchParams } = new URL(request.url);
  const queryValue = searchParams.get("vendorId")?.trim();
  return queryValue || null;
}

export async function POST(request: Request) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  if (!isDingerConfigured && !isDevBypassBilling) {
    return NextResponse.json({ error: "Dinger is not configured." }, { status: 500 });
  }

  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Missing authorization token." }, { status: 401 });
  }

  let body: {
    plan?: string;
    vendorType?: "solo_agent" | "agency" | "developer";
    vendorName?: string;
  } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!isVendorPlanKey(body.plan) || body.plan === "free") {
    return NextResponse.json({ error: "A paid plan is required for checkout." }, { status: 400 });
  }

  const plan = getVendorPlan(body.plan);
  const vendorType = body.vendorType ?? "agency";

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  const user = userData.user;

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id,full_name,email,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profileData) {
    return NextResponse.json({ error: profileError?.message ?? "Profile not found." }, { status: 403 });
  }

  if (profileData.role !== "vendor_user") {
    return NextResponse.json({ error: "Only vendor accounts can start billing checkout." }, { status: 403 });
  }

  const { data: existingMembershipRows, error: membershipError } = await supabase
    .from("vendor_members")
    .select(
      "vendor_id,role,status,vendor:vendors(id,name,plan,billing_status,description,contact_phone,contact_email,logo_url,public_storefront_enabled,slug)"
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  const membershipEntries = (existingMembershipRows ?? []) as Array<
    | {
        vendor_id?: string | null;
        role?: string | null;
        status?: string | null;
        vendor?:
          | {
              id?: string | null;
              name?: string | null;
              plan?: string | null;
              billing_status?: string | null;
              description?: string | null;
              contact_phone?: string | null;
              contact_email?: string | null;
              logo_url?: string | null;
              public_storefront_enabled?: boolean | null;
              slug?: string | null;
            }
          | Array<{
              id?: string | null;
              name?: string | null;
              plan?: string | null;
              billing_status?: string | null;
              description?: string | null;
              contact_phone?: string | null;
              contact_email?: string | null;
              logo_url?: string | null;
              public_storefront_enabled?: boolean | null;
              slug?: string | null;
            }>
          | null;
      }
  >;

  const requestedVendorId = getRequestedVendorId(request);
  if (membershipEntries.length > 1 && !requestedVendorId) {
    return NextResponse.json({ error: "Select an active vendor workspace before starting checkout." }, { status: 400 });
  }
  const existingMembership = (
    requestedVendorId
      ? membershipEntries.find((row) => String(row.vendor_id ?? "") === requestedVendorId)
      : membershipEntries[0]
  ) as
    | {
        vendor_id?: string | null;
        role?: string | null;
        status?: string | null;
        vendor?:
          | {
              id?: string | null;
              name?: string | null;
              plan?: string | null;
              billing_status?: string | null;
              description?: string | null;
              contact_phone?: string | null;
              contact_email?: string | null;
              logo_url?: string | null;
              public_storefront_enabled?: boolean | null;
              slug?: string | null;
            }
          | Array<{
              id?: string | null;
              name?: string | null;
              plan?: string | null;
              billing_status?: string | null;
              description?: string | null;
              contact_phone?: string | null;
              contact_email?: string | null;
              logo_url?: string | null;
              public_storefront_enabled?: boolean | null;
              slug?: string | null;
            }>
          | null;
      }
    | undefined;

  const existingVendor = Array.isArray(existingMembership?.vendor)
    ? existingMembership?.vendor[0]
    : existingMembership?.vendor;

  let vendorId = existingVendor?.id ? String(existingVendor.id) : null;

  if (requestedVendorId && membershipEntries.length > 0 && !existingMembership) {
    return NextResponse.json({ error: "Vendor workspace not found." }, { status: 403 });
  }

  if (!vendorId) {
    const vendorName =
      body.vendorName?.trim() ||
      (typeof profileData.full_name === "string" && profileData.full_name.trim()) ||
      getFallbackVendorName((profileData.email as string | null | undefined) ?? user.email);

    const { data: vendorData, error: vendorInsertError } = await supabase
      .from("vendors")
      .insert({
        name: vendorName,
        vendor_type: vendorType,
        plan: plan.key,
        billing_status: "pending",
        billing_provider: dingerBillingProvider,
      })
      .select("id")
      .single();

    if (vendorInsertError || !vendorData?.id) {
      return NextResponse.json(
        { error: vendorInsertError?.message ?? "Unable to create vendor workspace for checkout." },
        { status: 500 }
      );
    }

    vendorId = String(vendorData.id);

    const { error: memberInsertError } = await supabase.from("vendor_members").insert({
      vendor_id: vendorId,
      user_id: user.id,
      role: "owner",
      status: "active",
    });

    if (memberInsertError) {
      await supabase.from("vendors").delete().eq("id", vendorId);
      return NextResponse.json({ error: memberInsertError.message }, { status: 500 });
    }
  } else {
    if (!canManageBilling(existingMembership?.role)) {
      return NextResponse.json({ error: "Only workspace owners can start billing checkout." }, { status: 403 });
    }

    const contextResult = await getVendorRequestContext(request, { allowPendingBilling: true });
    if (!contextResult.ok) {
      return contextResult.response;
    }

    if (contextResult.context.vendor.id !== vendorId || !canManageBilling(contextResult.context.membership.role)) {
      return NextResponse.json({ error: "Only workspace owners can start billing checkout." }, { status: 403 });
    }

    const { error: vendorUpdateError } = await supabase
      .from("vendors")
      .update({
        plan: plan.key,
        billing_status: "pending",
        billing_provider: dingerBillingProvider,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vendorId);

    if (vendorUpdateError) {
      return NextResponse.json({ error: vendorUpdateError.message }, { status: 500 });
    }
  }

  const merchantOrderId = `vendor-plan-${vendorId}-${Date.now()}`;

  const { data: paymentRow, error: paymentError } = await supabase
    .from("vendor_payments")
    .insert({
      vendor_id: vendorId,
      plan: plan.key,
      amount: plan.monthlyPriceMmk,
      currency: "MMK",
      provider: dingerBillingProvider,
      provider_order_id: merchantOrderId,
      status: isDevBypassBilling ? "paid" : "pending",
      raw_payload: {
        initiated_by: user.id,
        source: isDevBypassBilling ? "vendor_setup_dev_bypass" : "vendor_setup",
        dev_bypass: isDevBypassBilling,
      },
    })
    .select("id")
    .single();

  if (paymentError || !paymentRow?.id) {
    return NextResponse.json({ error: paymentError?.message ?? "Unable to create payment record." }, { status: 500 });
  }

  if (isDevBypassBilling) {
    const { error: activateVendorError } = await supabase
      .from("vendors")
      .update({
        plan: plan.key,
        billing_status: "active",
        billing_provider: dingerBillingProvider,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vendorId);

    if (activateVendorError) {
      return NextResponse.json({ error: activateVendorError.message }, { status: 500 });
    }

    const storefrontReady = existingVendor ? isVendorStorefrontSetupComplete(existingVendor) : false;
    const redirectTo = storefrontReady ? "/hub" : "/agency-setup";

    return NextResponse.json({
      ok: true,
      checkoutUrl: redirectTo,
      vendorId,
      paymentId: String(paymentRow.id),
      merchantOrderId,
      plan: plan.key,
      devBypass: true,
    });
  }

  const checkoutUrl = createDingerPrebuiltCheckoutUrl({
    clientId: dingerClientId,
    publicKey: dingerPublicKey,
    merchantKey: dingerMerchantKey,
    projectName: dingerProjectName,
    merchantName: dingerMerchantName,
    customerName:
      (typeof profileData.full_name === "string" && profileData.full_name.trim()) ||
      (profileData.email as string | null) ||
      "Vendor User",
    totalAmount: plan.monthlyPriceMmk,
    merchantOrderId,
    items: [
      {
        name: `${plan.name} vendor plan`,
        amount: plan.monthlyPriceMmk,
        quantity: 1,
      },
    ],
    production: process.env.DINGER_ENV === "production",
  });

  return NextResponse.json({
    ok: true,
    checkoutUrl,
    vendorId,
    paymentId: String(paymentRow.id),
    merchantOrderId,
    plan: plan.key,
  });
}
