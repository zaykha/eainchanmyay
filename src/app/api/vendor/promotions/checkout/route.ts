import { NextResponse } from "next/server";
import { createDingerPrebuiltCheckoutUrl } from "@/lib/dinger";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { normalizePromotionStatus, normalizePromotionType } from "@/lib/vendor-promotions";

const dingerClientId = process.env.DINGER_CLIENT_ID ?? "";
const dingerPublicKey = process.env.DINGER_PUBLIC_KEY ?? "";
const dingerMerchantKey = process.env.DINGER_MERCHANT_KEY ?? "";
const dingerProjectName = process.env.DINGER_PROJECT_NAME ?? "";
const dingerMerchantName = process.env.DINGER_MERCHANT_NAME ?? "";
const enablePromotionDingerCheckout = process.env.ENABLE_PROMOTION_DINGER_CHECKOUT === "true";
const isDingerConfigured = Boolean(
  dingerClientId && dingerPublicKey && dingerMerchantKey && dingerProjectName && dingerMerchantName
);

type CheckoutBody = {
  promotionId?: string | null;
};

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) return result.response;

  const { supabase, vendor, membership } = result.context;
  if (!["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Only owners and admins can start promotion checkout." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as CheckoutBody | null;
  const promotionId = String(body?.promotionId ?? "").trim();
  if (!promotionId) {
    return NextResponse.json({ error: "promotionId is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("vendor_promotions")
    .select("id,vendor_id,listing_id,promotion_type,status,title,price_per_24h,duration_hours")
    .eq("id", promotionId)
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data?.id) {
    return NextResponse.json({ error: "Promotion not found." }, { status: 404 });
  }

  const status = normalizePromotionStatus(data.status);
  if (status && !["draft", "pending_payment"].includes(status)) {
    return NextResponse.json({ error: "Only draft promotions can enter checkout." }, { status: 400 });
  }

  const promotionType = normalizePromotionType(data.promotion_type);
  const durationHours = Number(data.duration_hours ?? 0);
  const pricePer24h = Number(data.price_per_24h ?? 0);
  if (!promotionType || durationHours <= 0 || pricePer24h < 0) {
    return NextResponse.json({ error: "Promotion pricing details are incomplete." }, { status: 400 });
  }

  const totalAmount = Math.round((pricePer24h * durationHours) / 24);
  const merchantOrderId = `promotion-${vendor.id}-${promotionId}-${Date.now()}`;

  if (!enablePromotionDingerCheckout || !isDingerConfigured) {
    const { data: updatedPromotion, error: updateError } = await supabase
      .from("vendor_promotions")
      .update({
        status: "active",
        price_paid: totalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", promotionId)
      .eq("vendor_id", vendor.id)
      .select("id,status,price_paid,updated_at")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      mode: "dev_bypass",
      promotionId,
      merchantOrderId,
      checkoutUrl: null,
      item: updatedPromotion,
      message: "Dev payment complete. Promotion is now active.",
      todo: "Enable ENABLE_PROMOTION_DINGER_CHECKOUT and configure DINGER_* env vars to switch this route to real checkout.",
    });
  }

  const { error: pendingError } = await supabase
    .from("vendor_promotions")
    .update({
      status: "pending_payment",
      updated_at: new Date().toISOString(),
    })
    .eq("id", promotionId)
    .eq("vendor_id", vendor.id);

  if (pendingError) {
    return NextResponse.json({ error: pendingError.message }, { status: 500 });
  }

  const checkoutUrl = createDingerPrebuiltCheckoutUrl({
    clientId: dingerClientId,
    publicKey: dingerPublicKey,
    merchantKey: dingerMerchantKey,
    projectName: dingerProjectName,
    merchantName: dingerMerchantName,
    customerName: vendor.name || "Verified Agency",
    totalAmount,
    merchantOrderId,
    items: [
      {
        name: data.title?.trim() || `${promotionType} promotion`,
        amount: totalAmount,
        quantity: 1,
      },
    ],
    production: process.env.DINGER_ENV === "production",
  });

  return NextResponse.json({
    ok: true,
    mode: "dinger",
    promotionId,
    merchantOrderId,
    checkoutUrl,
  });
}
