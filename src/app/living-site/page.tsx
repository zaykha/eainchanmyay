import { Suspense } from "react";
import { HomePageClient } from "@/app/living-site/HomePageClient";

export default function HomePage() {
  return (
    <Suspense>
      <HomePageClient />
    </Suspense>
  );
}
