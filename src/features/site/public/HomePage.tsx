import { Suspense } from "react";
import { HomePageClient } from "@/features/site/public/HomePageClient";

export default function HomePage() {
  return (
    <Suspense>
      <HomePageClient />
    </Suspense>
  );
}
