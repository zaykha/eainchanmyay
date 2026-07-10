import { Suspense } from "react";
import NewInquiryPage from "@/features/site/public/inquiries/new/NewInquiryPage";

export default function NewInquiryRoutePage() {
  return (
    <Suspense fallback={null}>
      <NewInquiryPage />
    </Suspense>
  );
}
