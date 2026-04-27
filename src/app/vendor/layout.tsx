import { VendorShell } from "@/app/living-site/components/vendor/VendorShell";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return <VendorShell>{children}</VendorShell>;
}
