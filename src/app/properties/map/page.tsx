import { Suspense } from "react";
import PropertyMapView from "./PropertyMapView";

export default function PropertyMapPage() {
  return (
    <Suspense fallback={null}>
      <PropertyMapView />
    </Suspense>
  );
}
