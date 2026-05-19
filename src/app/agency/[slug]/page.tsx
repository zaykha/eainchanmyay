"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import styled from "styled-components";
import { useParams } from "next/navigation";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";
import { MarketplaceHeader } from "@/app/living-site/components/MarketplaceHeader";
import { SectionTitle } from "@/app/living-site/components/PageSection";
import { formatCurrency } from "@/app/living-site/lib/format";
import { resolveImage } from "@/app/living-site/lib/images";
import { useAppState } from "@/app/living-site/lib/app-state";
import { useI18n } from "@/app/living-site/lib/i18n";

type AgencyPayload = {
  agency: {
    id: string;
    name: string;
    vendor_type: string | null;
    plan: string | null;
    plan_name: string;
    verified_status: string | null;
    slug: string | null;
    tagline: string | null;
    description: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    logo_url: string | null;
    facebook_url: string | null;
    telegram_url: string | null;
    viber_phone: string | null;
    tiktok_url: string | null;
    website_url: string | null;
    cover_image_url: string | null;
    strengths: string[];
    badges: string[];
  };
  listings: Array<{
    id: string;
    title: string;
    deal_type: string | null;
    property_type: string | null;
    price: number | null;
    currency: string | null;
    state_region: string | null;
    district: string | null;
    township: string | null;
    city: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    area_sqft: number | null;
    image_url: string | null | undefined;
  }>;
  viewer?: {
    is_member?: boolean;
  };
};

const Shell = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(15, 118, 110, 0.18), transparent 32%),
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.16), transparent 28%),
    linear-gradient(180deg, #f4efe6 0%, #fffaf3 36%, #ffffff 100%);
`;

const Page = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 18px 16px 84px;
  display: grid;
  gap: 22px;
`;

const Hero = styled.section`
  position: relative;
  overflow: hidden;
  border-radius: 30px;
  min-height: 320px;
  padding: 28px;
  border: 1px solid rgba(14, 31, 53, 0.1);
  box-shadow: 0 30px 70px rgba(31, 41, 55, 0.08);
  background:
    linear-gradient(135deg, rgba(10, 35, 66, 0.84), rgba(17, 94, 89, 0.86)),
    linear-gradient(120deg, #174f57, #102843);
  color: #f8fafc;
  display: grid;
  align-items: end;
`;

const HeroImage = styled.div<{ $image?: string | null }>`
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(7, 12, 22, 0.12), rgba(7, 12, 22, 0.64)),
    ${(props) => (props.$image ? `url(${props.$image}) center/cover no-repeat` : "none")};
  opacity: ${(props) => (props.$image ? 0.45 : 1)};
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  gap: 16px;
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const Logo = styled.div<{ $image?: string | null }>`
  width: 88px;
  height: 88px;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background:
    ${(props) =>
      props.$image
        ? `url(${props.$image}) center/cover no-repeat`
        : "linear-gradient(135deg, rgba(245, 158, 11, 0.28), rgba(255, 255, 255, 0.08))"};
  display: grid;
  place-items: center;
  font-size: 1.7rem;
  font-weight: 700;
`;

const HeroText = styled.div`
  display: grid;
  gap: 8px;
`;

const HeroTitle = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1.02;
`;

const HeroCopy = styled.p`
  margin: 0;
  max-width: 760px;
  color: rgba(241, 245, 249, 0.86);
  line-height: 1.7;
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.12);
  font-size: 0.82rem;
  font-weight: 700;
`;

const Layout = styled.div`
  display: grid;
  gap: 22px;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 0.95fr);
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.section`
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 22px 48px rgba(15, 23, 42, 0.06);
  padding: 18px;
  display: grid;
  gap: 14px;
`;

const BodyCopy = styled.p`
  margin: 0;
  color: #475467;
  font-size: 0.94rem;
  line-height: 1.6;
`;

const OverviewStack = styled.div`
  display: grid;
  gap: 12px;
`;

const CompactSectionTitle = styled.h2`
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
`;

const StrengthList = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const StrengthPill = styled.div`
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #0f172a;
  font-size: 0.84rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
`;

const ContactStack = styled.div`
  display: grid;
  gap: 8px;
`;

const ContactItem = styled.div`
  display: grid;
  gap: 3px;
  color: #475467;
  line-height: 1.45;

  strong {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #667085;
  }

  span,
  a {
    font-size: 0.94rem;
  }

  a {
    color: #0f172a;
    font-weight: 700;
  }
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const Action = styled(Link)`
  min-height: 44px;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: var(--gradient);
  color: white;
  font-weight: 700;
  font-size: 0.95rem;
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: var(--frame-shadow);
`;

const GhostAction = styled.a`
  min-height: 44px;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  color: var(--color-text);
  font-weight: 700;
  font-size: 0.95rem;
`;

const SidebarCard = styled(Card)`
  align-self: start;
  position: sticky;
  top: 18px;
`;

const ListingGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
`;

const ListingCard = styled(Link)`
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: white;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
  display: grid;
  color: inherit;
`;

const ListingImage = styled.div<{ $image?: string | null }>`
  aspect-ratio: 16 / 10;
  background:
    ${(props) =>
      props.$image
        ? `url(${props.$image}) center/cover no-repeat`
        : "linear-gradient(135deg, #dbeafe, #fef3c7)"};
`;

const ListingBody = styled.div`
  padding: 16px;
  display: grid;
  gap: 10px;
`;

const ListingTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.02rem;
`;

const ListingMeta = styled.div`
  color: #667085;
  font-size: 0.92rem;
  line-height: 1.5;
`;

const ListingPrice = styled.div`
  color: #115e59;
  font-size: 1.05rem;
  font-weight: 800;
`;

const EmptyState = styled.div`
  border-radius: 18px;
  border: 1px dashed rgba(15, 23, 42, 0.16);
  padding: 20px;
  color: #667085;
  background: #f8fafc;
`;

function formatLocation(listing: AgencyPayload["listings"][number]) {
  return [listing.township, listing.district, listing.state_region].filter(Boolean).join(", ") || listing.city || "Myanmar";
}

function formatLabel(value: string | null) {
  if (!value) return "";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AgencyStorefrontPage() {
  const params = useParams<{ slug: string }>();
  const { authToken } = useAppState();
  const { t } = useI18n();
  const [data, setData] = useState<AgencyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const slug = typeof params?.slug === "string" ? params.slug : "";
    if (!slug) {
      setError(t("agency.profileUnavailable"));
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/public/agencies/${encodeURIComponent(slug)}`, {
          headers: authToken
            ? {
                Authorization: `Bearer ${authToken}`,
              }
            : undefined,
        });
        const payload = (await response.json()) as AgencyPayload & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || t("agency.profileUnavailableCopy"));
        }
        if (!cancelled) {
          setData(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("agency.profileUnavailableCopy"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [authToken, params?.slug, t]);

  if (loading) {
    return <LoadingOverlay message={t("agency.loadingProfile")} />;
  }

  const agency = data?.agency;
  const listings = data?.listings ?? [];
  const logoUrl = resolveImage(agency?.logo_url ?? null);
  const coverImageUrl = resolveImage(agency?.cover_image_url ?? null);
  const isVerified = agency?.verified_status === "approved";
  const isAgencyMemberViewer = Boolean(data?.viewer?.is_member);

  return (
    <Shell>
      <MarketplaceHeader />
      <Page>
        {error || !agency ? (
          <Card>
            <SectionTitle>Agency profile unavailable</SectionTitle>
            <BodyCopy>{error || "This agency profile could not be loaded."}</BodyCopy>
          </Card>
        ) : (
          <>
            <Hero>
              <HeroImage $image={coverImageUrl} />
              <HeroContent>
                <LogoRow>
                  <Logo $image={logoUrl}>{agency.name.charAt(0).toUpperCase()}</Logo>
                  <HeroText>
                    <HeroTitle>{agency.name}</HeroTitle>
                    <HeroCopy>{agency.tagline || t("agency.defaultTagline")}</HeroCopy>
                  </HeroText>
                </LogoRow>
                <BadgeRow>
                  <Badge>
                    <ShieldCheck size={14} />
                    {isVerified ? t("agency.verifiedStatus") : t("agency.unverifiedStatus")}
                  </Badge>
                </BadgeRow>
              </HeroContent>
            </Hero>

            <Layout>
              <div style={{ display: "grid", gap: 22 }}>
                <Card>
                  <SectionTitle>{t("agency.overview")}</SectionTitle>
                  <OverviewStack>
                    <div style={{ display: "grid", gap: 8 }}>
                      <CompactSectionTitle>{t("agency.about")}</CompactSectionTitle>
                      <BodyCopy>
                        {agency.description ||
                          t("agency.aboutFallback")}
                      </BodyCopy>
                    </div>
                    {agency.strengths.length ? (
                      <div style={{ display: "grid", gap: 8 }}>
                        <CompactSectionTitle>{t("agency.strengths")}</CompactSectionTitle>
                        <StrengthList>
                          {agency.strengths.map((strength) => (
                            <StrengthPill key={strength}>{strength}</StrengthPill>
                          ))}
                        </StrengthList>
                      </div>
                    ) : null}
                  </OverviewStack>
                </Card>

                <Card>
                  <SectionTitle>{t("agency.publicListings")}</SectionTitle>
                  {listings.length ? (
                    <ListingGrid>
                      {listings.map((listing) => (
                        <ListingCard key={listing.id} href={`/listing/${listing.id}`}>
                          <ListingImage $image={resolveImage(listing.image_url ?? null)} />
                          <ListingBody>
                            <ListingTitle>{listing.title}</ListingTitle>
                            <ListingPrice>
                              {listing.price ? formatCurrency(listing.price, listing.currency || "MMK") : t("agency.priceOnRequest")}
                            </ListingPrice>
                            <ListingMeta>
                              {formatLocation(listing)}
                              <br />
                              {[formatLabel(listing.deal_type), formatLabel(listing.property_type)].filter(Boolean).join(" • ")}
                            </ListingMeta>
                          </ListingBody>
                        </ListingCard>
                      ))}
                    </ListingGrid>
                  ) : (
                    <EmptyState>{t("agency.noListings")}</EmptyState>
                  )}
                </Card>
              </div>

              <div style={{ display: "grid", gap: 22 }}>
                <SidebarCard>
                  <SectionTitle>{t("agency.contactPoints")}</SectionTitle>
                  <ContactStack>
                    <ContactItem>
                      <strong>{t("agency.verification")}</strong>
                      <span>{isVerified ? t("agency.verified") : t("agency.unverified")}</span>
                    </ContactItem>
                    {agency.contact_phone ? (
                      <ContactItem>
                        <strong>{t("agency.phone")}</strong>
                        <a href={`tel:${agency.contact_phone}`}>
                          <Phone size={15} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
                          {agency.contact_phone}
                        </a>
                      </ContactItem>
                    ) : null}
                    {agency.contact_email ? (
                      <ContactItem>
                        <strong>{t("agency.email")}</strong>
                        <a href={`mailto:${agency.contact_email}`}>
                          <Mail size={15} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
                          {agency.contact_email}
                        </a>
                      </ContactItem>
                    ) : null}
                    {agency.facebook_url ? (
                      <ContactItem>
                        <strong>Facebook</strong>
                        <a href={agency.facebook_url} target="_blank" rel="noreferrer">
                          {agency.facebook_url}
                        </a>
                      </ContactItem>
                    ) : null}
                    {agency.telegram_url ? (
                      <ContactItem>
                        <strong>Telegram</strong>
                        <a href={agency.telegram_url} target="_blank" rel="noreferrer">
                          {agency.telegram_url}
                        </a>
                      </ContactItem>
                    ) : null}
                    {agency.viber_phone ? (
                      <ContactItem>
                        <strong>Viber</strong>
                        <a href={`tel:${agency.viber_phone}`}>{agency.viber_phone}</a>
                      </ContactItem>
                    ) : null}
                    {agency.tiktok_url ? (
                      <ContactItem>
                        <strong>TikTok</strong>
                        <a href={agency.tiktok_url} target="_blank" rel="noreferrer">
                          {agency.tiktok_url}
                        </a>
                      </ContactItem>
                    ) : null}
                    {agency.website_url ? (
                      <ContactItem>
                        <strong>Website</strong>
                        <a href={agency.website_url} target="_blank" rel="noreferrer">
                          {agency.website_url}
                        </a>
                      </ContactItem>
                    ) : null}
                    <ContactItem>
                      <strong>{t("agency.coverage")}</strong>
                      <span>
                        <MapPin size={15} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
                        {t("agency.marketplaceCoverage")}
                      </span>
                    </ContactItem>
                  </ContactStack>
                  {isAgencyMemberViewer ? null : (
                    <ActionRow>
                      <Action
                        href={{
                          pathname: "/inquiries/new",
                          query: {
                            agencyId: agency.id,
                            agency: agency.name,
                            agencySlug: agency.slug || "",
                            agencyLogo: agency.logo_url || "",
                          },
                        }}
                      >
                        {t("agency.requestPropertyHelp")}
                      </Action>
                      {agency.contact_phone ? (
                        <GhostAction href={`tel:${agency.contact_phone}`}>{t("agency.callAgency")}</GhostAction>
                      ) : null}
                    </ActionRow>
                  )}
                </SidebarCard>
              </div>
            </Layout>
          </>
        )}
      </Page>
    </Shell>
  );
}
