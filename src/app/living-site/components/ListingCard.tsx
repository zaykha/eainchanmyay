"use client";

import Link from "next/link";
import {
  Building2,
  Home,
  LandPlot,
  Landmark,
  MapPin,
  Ruler,
  Store,
  TowerControl,
  Warehouse,
} from "lucide-react";
import styled from "styled-components";
import type { Listing } from "@/app/living-site/lib/data";
import { formatCurrency } from "@/app/living-site/lib/format";
import { useI18n } from "@/app/living-site/lib/i18n";

const Card = styled.article`
  background: var(--color-surface);
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-soft);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-soft);
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: var(--frame-shadow);
    pointer-events: none;
  }
`;

const Cover = styled.div`
  width: 100%;
  aspect-ratio: 4 / 3;
  background: var(--color-paper);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
  font-size: 0.9rem;
  position: relative;
  overflow: hidden;
`;

const DealRibbon = styled.span<{ $dealType?: string }>`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  background: ${(props) =>
    props.$dealType === "rent"
      ? "var(--color-success)"
      : props.$dealType === "sale"
        ? "var(--color-primary)"
        : "var(--color-muted)"};
  box-shadow: var(--shadow-soft);
`;

const PricePill = styled.span`
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-outline);
  box-shadow: var(--shadow-soft);
`;

const Content = styled.div`
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: stretch;
`;

const LeftStack = styled.div`
  display: grid;
  gap: 8px;

  @media (max-width: 600px) {
    gap: 0px;
  }
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  @media (max-width: 600px) {
    font-size: 0.95rem;
  }
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-muted);
  font-size: 0.9rem;

  svg {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 600px) {
    font-size: 0.8rem;

    svg {
      width: 12px;
      height: 12px;
    }
  }
`;

const PropertyTypeTag = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--color-muted);
  font-size: 0.78rem;
  text-align: center;
  height: 100%;
  justify-content: center;
  width: 88px;
  padding: 8px 6px;

  svg {
    width: 22px;
    height: 22px;
  }
`;

type ListingCardProps = {
  listing: Listing;
};

const formatLabel = (value?: string) =>
  value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : "";

const formatDealType = (value: string | undefined, t: (key: string) => string) => {
  if (!value) return "";
  const lowered = value.toLowerCase();
  if (lowered === "sale") return t("listing.forSale");
  if (lowered === "rent") return t("listing.forRent");
  return formatLabel(value);
};

const getPropertyTypeLabel = (value: string | undefined, t: (key: string) => string) => {
  if (!value) return "";
  const lowered = value.toLowerCase();
  if (lowered === "land") return t("property.land");
  if (lowered === "house") return t("property.house");
  if (lowered === "house_land") return t("property.houseLand");
  if (lowered === "apartment") return t("property.apartment");
  if (lowered === "mini_condo") return t("property.miniCondo");
  if (lowered === "condo") return t("property.condo");
  if (lowered === "serviced_apartment") return t("property.servicedApartment");
  if (["shop_office", "hotel_restaurant", "commercial"].includes(lowered)) {
    return t("property.commercial");
  }
  if (lowered === "warehouse") return t("property.warehouse");
  return formatLabel(value);
};

const getPropertyTypeIcon = (value?: string, size = 20) => {
  const lowered = value?.toLowerCase() ?? "";
  if (["land"].includes(lowered)) return <LandPlot size={size} />;
  if (["house", "house_land"].includes(lowered)) return <Home size={size} />;
  if (["condo", "mini_condo"].includes(lowered)) return <TowerControl size={size} />;
  if (["apartment", "serviced_apartment"].includes(lowered)) return <Building2 size={size} />;
  if (["shop_office", "hotel_restaurant", "commercial"].includes(lowered)) return <Store size={size} />;
  if (["warehouse"].includes(lowered)) return <Warehouse size={size} />;
  return <Home size={size} />;
};

export function ListingCard({ listing }: ListingCardProps) {
  const { t } = useI18n();
  const normalizedDealType = listing.dealType?.toLowerCase();
  const dealLabel = formatDealType(listing.dealType, t) || t("listing.forSale");
  const cityLabel = listing.city || listing.location;
  const townshipLabel = listing.township || listing.district || "";
  const areaLabel = listing.areaSqft
    ? `${listing.areaSqft.toLocaleString("en-US")} ${t("listing.areaSqft")}`
    : "";
  const title = listing.title || t("listing.property");
  return (
    <Link href={`/listing/${listing.id}`} aria-label={title}>
      <Card>
        <Cover>
          {listing.imageUrl ? (
            <img src={listing.imageUrl} alt={title} />
          ) : (
            <span>{t("listing.noPhoto")}</span>
          )}
          <DealRibbon $dealType={normalizedDealType}>{dealLabel}</DealRibbon>
          <PricePill>
            {formatCurrency(listing.price, listing.currency, t("listing.contactPrice"))}
          </PricePill>
        </Cover>
        <Content>
          <LeftStack>
            <Title>{title}</Title>
            <InfoRow>
              <MapPin />
              {townshipLabel || t("listing.townshipTbd")}
            </InfoRow>
            <InfoRow>
              <Landmark />
              {cityLabel || t("listing.cityTbd")}
            </InfoRow>
           
            {areaLabel ? (
              <InfoRow>
                <Ruler />
                {areaLabel}
              </InfoRow>
            ) : null}
          </LeftStack>
          <PropertyTypeTag>
            {getPropertyTypeIcon(listing.propertyType)}
            <span>{getPropertyTypeLabel(listing.propertyType, t) || t("listing.property")}</span>
          </PropertyTypeTag>
        </Content>
      </Card>
    </Link>
  );
}
