import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  decryptDingerPaymentResult,
  getDingerBillingDates,
  mapDingerStatusToInternal,
  parseDingerPaymentResult,
  validateDingerCallbackChecksum,
} from "@/lib/dinger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const dingerCallbackSecretKey = process.env.DINGER_CALLBACK_SECRET_KEY ?? "";
const dingerBillingProvider = "dinger";

const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey && dingerCallbackSecretKey);

type DingerCallbackPayload = {
  paymentResult?: string;
  checksum?: string;
};

async function getCallbackPayload(request: Request): Promise<DingerCallbackPayload | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json().catch(() => null)) as DingerCallbackPayload | null;
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formText = await request.text().catch(() => "");
    const searchParams = new URLSearchParams(formText);
    return {
      paymentResult: searchParams.get("paymentResult") ?? undefined,
      checksum: searchParams.get("checksum") ?? undefined,
    };
  }

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData().catch(() => null);
    if (!formData) return null;
    return {
      paymentResult: String(formData.get("paymentResult") ?? ""),
      checksum: String(formData.get("checksum") ?? ""),
    };
  }

  return (await request.json().catch(() => null)) as DingerCallbackPayload | null;
}

export async function POST(request: Request) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Billing callback is not configured." }, { status: 500 });
  }

  const callbackPayload = await getCallbackPayload(request);
  const paymentResult = callbackPayload?.paymentResult?.trim();
  const checksum = callbackPayload?.checksum?.trim().toLowerCase();

  if (!paymentResult || !checksum) {
    return NextResponse.json({ error: "Missing callback payload." }, { status: 400 });
  }

  let decryptedPayload = "";
  try {
    decryptedPayload = decryptDingerPaymentResult(paymentResult, dingerCallbackSecretKey);
  } catch {
    return NextResponse.json({ error: "Unable to decrypt callback payload." }, { status: 400 });
  }

  if (!validateDingerCallbackChecksum(decryptedPayload, checksum)) {
    return NextResponse.json({ error: "Invalid callback checksum." }, { status: 400 });
  }

  let paymentData: ReturnType<typeof parseDingerPaymentResult>;
  try {
    paymentData = parseDingerPaymentResult(decryptedPayload);
  } catch {
    return NextResponse.json({ error: "Invalid callback JSON payload." }, { status: 400 });
  }

  const merchantOrderId = String(paymentData.merchantOrderId ?? "").trim();
  if (!merchantOrderId) {
    return NextResponse.json({ error: "Missing merchantOrderId." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: paymentRow, error: paymentLookupError } = await supabase
    .from("vendor_payments")
    .select("id,vendor_id,plan,status")
    .eq("provider", dingerBillingProvider)
    .eq("provider_order_id", merchantOrderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (paymentLookupError) {
    return NextResponse.json({ error: paymentLookupError.message }, { status: 500 });
  }

  if (!paymentRow?.id || !paymentRow.vendor_id) {
    return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
  }

  const internalStatus = mapDingerStatusToInternal(paymentData.transactionStatus);
  const now = new Date();
  const billingDates = internalStatus === "paid" ? getDingerBillingDates(now) : null;

  const rawPayload = {
    callback: callbackPayload,
    decryptedPayload: paymentData,
    receivedAt: now.toISOString(),
  };

  const { error: paymentUpdateError } = await supabase
    .from("vendor_payments")
    .update({
      provider_payment_id: paymentData.transactionId ?? null,
      status: internalStatus,
      paid_at: billingDates?.paidAt ?? null,
      raw_payload: rawPayload,
      updated_at: now.toISOString(),
    })
    .eq("id", paymentRow.id);

  if (paymentUpdateError) {
    return NextResponse.json({ error: paymentUpdateError.message }, { status: 500 });
  }

  if (internalStatus === "paid") {
    const { error: vendorUpdateError } = await supabase
      .from("vendors")
      .update({
        plan: paymentRow.plan,
        billing_status: "active",
        billing_provider: dingerBillingProvider,
        subscription_started_at: billingDates?.subscriptionStartedAt ?? null,
        subscription_ends_at: billingDates?.subscriptionEndsAt ?? null,
        next_billing_at: billingDates?.nextBillingAt ?? null,
        updated_at: now.toISOString(),
      })
      .eq("id", paymentRow.vendor_id);

    if (vendorUpdateError) {
      return NextResponse.json({ error: vendorUpdateError.message }, { status: 500 });
    }
  } else if (internalStatus === "failed" || internalStatus === "canceled") {
    const { error: vendorDowngradeError } = await supabase
      .from("vendors")
      .update({
        plan: "free",
        billing_status: internalStatus === "canceled" ? "canceled" : "inactive",
        billing_provider: dingerBillingProvider,
        subscription_started_at: null,
        subscription_ends_at: null,
        next_billing_at: null,
        updated_at: now.toISOString(),
      })
      .eq("id", paymentRow.vendor_id);

    if (vendorDowngradeError) {
      return NextResponse.json({ error: vendorDowngradeError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    merchantOrderId,
    status: internalStatus,
  });
}
