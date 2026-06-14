import { VendorPropertyEditView } from "@/features/site/vendor/components/VendorPropertyEditView";

export default async function VendorPropertyEditPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  return <VendorPropertyEditView propertyId={propertyId} />;
}
