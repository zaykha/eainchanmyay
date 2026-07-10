import { Suspense } from "react";
import ActivitiesPage from "@/features/site/public/activities/ActivitiesPage";

export default function ActivitiesRoutePage() {
  return (
    <Suspense fallback={null}>
      <ActivitiesPage />
    </Suspense>
  );
}
