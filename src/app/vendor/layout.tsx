import { VendorShell } from "@/features/site/vendor/components/VendorShell";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return <VendorShell>{children}</VendorShell>;
}
