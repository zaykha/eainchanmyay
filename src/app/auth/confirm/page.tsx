import { Suspense } from "react";
import AuthConfirmPageClient from "./AuthConfirmPageClient";

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={null}>
      <AuthConfirmPageClient />
    </Suspense>
  );
}
