import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { vendor, membership, profile } = result.context;

  return NextResponse.json({
    vendor,
    membership,
    profile: {
      full_name: profile.full_name,
      email: profile.email,
    },
  });
}
