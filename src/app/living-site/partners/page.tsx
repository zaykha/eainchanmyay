import type { Metadata } from "next";
import { PartnersIndexView } from "@/app/living-site/partners/PartnersIndexView";
import { getPublicAgencies } from "@/lib/public-agencies";

export const metadata: Metadata = {
  title: "Our Partners | Eain Chan Myay",
  description: "Discover agencies and verified partners on Eain Chan Myay.",
};

export default async function PartnersPage() {
  const agencies = await getPublicAgencies();

  return <PartnersIndexView agencies={agencies} />;
}
