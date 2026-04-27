import { VendorPropertyEditView } from "@/app/living-site/components/vendor/VendorPropertyEditView";

export default async function VendorPropertyEditPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  return <VendorPropertyEditView propertyId={propertyId} />;
}
