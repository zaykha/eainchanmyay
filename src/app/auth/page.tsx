import { Suspense } from "react";
import AuthPage from "@/features/site/public/auth/AuthPage";

export default function AuthRoutePage() {
  return (
    <Suspense fallback={null}>
      <AuthPage />
    </Suspense>
  );
}
