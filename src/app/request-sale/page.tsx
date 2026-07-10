import { Suspense } from "react";
import RequestSalePage from "@/features/site/public/request-sale/RequestSalePage";

export default function RequestSaleRoutePage() {
  return (
    <Suspense fallback={null}>
      <RequestSalePage />
    </Suspense>
  );
}
