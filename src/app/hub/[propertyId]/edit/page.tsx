import { Suspense } from "react";
import { RequestSalePageContent } from "@/app/living-site/request-sale/page";

function HubEditSkeleton() {
  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: 16,
        display: "grid",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 12,
          padding: 20,
          borderRadius: 18,
          border: "1px solid var(--color-outline)",
          background: "var(--color-surface-2)",
        }}
      >
        <div style={{ height: 26, width: "32%", borderRadius: 12, background: "color-mix(in srgb, var(--color-outline) 30%, white)" }} />
        <div style={{ height: 16, width: "54%", borderRadius: 12, background: "color-mix(in srgb, var(--color-outline) 24%, white)" }} />
      </div>
      <div
        style={{
          display: "grid",
          gap: 12,
          padding: 20,
          borderRadius: 18,
          border: "1px solid var(--color-outline)",
          background: "var(--color-surface-2)",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ height: 30, width: 92, borderRadius: 999, background: "color-mix(in srgb, var(--color-outline) 28%, white)" }} />
          <div style={{ height: 30, width: 96, borderRadius: 999, background: "color-mix(in srgb, var(--color-outline) 22%, white)" }} />
          <div style={{ height: 30, width: 88, borderRadius: 999, background: "color-mix(in srgb, var(--color-outline) 22%, white)" }} />
        </div>
        <div style={{ height: 220, borderRadius: 16, background: "color-mix(in srgb, var(--color-outline) 18%, white)" }} />
        <div style={{ height: 220, borderRadius: 16, background: "color-mix(in srgb, var(--color-outline) 18%, white)" }} />
      </div>
    </div>
  );
}

export default async function HubPropertyEditPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;

  return (
    <Suspense fallback={<HubEditSkeleton />}>
      <RequestSalePageContent forcedEditId={propertyId} vendorReturnPath="/hub?section=manage-listings" />
    </Suspense>
  );
}
