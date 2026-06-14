import { VendorPropertyDetailView } from "@/features/site/vendor/components/VendorPropertyDetailView";

export default async function VendorPropertyDetailPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  return <VendorPropertyDetailView propertyId={propertyId} />;
}
