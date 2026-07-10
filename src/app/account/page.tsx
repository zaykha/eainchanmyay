import { Suspense } from "react";
import AccountPage from "@/features/site/public/account/AccountPage";

export default function AccountRoutePage() {
  return (
    <Suspense fallback={null}>
      <AccountPage />
    </Suspense>
  );
}
