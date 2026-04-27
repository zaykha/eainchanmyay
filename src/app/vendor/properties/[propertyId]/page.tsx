import { VendorPropertyDetailView } from "@/app/living-site/components/vendor/VendorPropertyDetailView";

export default async function VendorPropertyDetailPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  return <VendorPropertyDetailView propertyId={propertyId} />;
}
