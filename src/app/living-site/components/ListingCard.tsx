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

const formatDealType = (value?: string) => {
  if (!value) return "";
  const lowered = value.toLowerCase();
  if (lowered === "sale") return "For sale";
  if (lowered === "rent") return "For rent";
  return formatLabel(value);
};

const formatPropertyType = (value?: string) => {
  if (!value) return "";
  const lowered = value.toLowerCase();
  if (lowered === "house_land") return "House + Land";
  return formatLabel(value);
};

const formatArea = (value?: number) => {
  if (!value) return "";
  return `${value.toLocaleString("en-US")} sqft`;
};

const getPropertyTypeIcon = (value?: string) => {
  const lowered = value?.toLowerCase() ?? "";
  if (["land"].includes(lowered)) return LandPlot;
  if (["house", "house_land"].includes(lowered)) return Home;
  if (["condo", "mini_condo"].includes(lowered)) return TowerControl;
  if (["apartment", "serviced_apartment"].includes(lowered)) return Building2;
  if (["shop_office", "hotel_restaurant", "commercial"].includes(lowered)) return Store;
  if (["warehouse"].includes(lowered)) return Warehouse;
  return Home;
};

export function ListingCard({ listing }: ListingCardProps) {
  const normalizedDealType = listing.dealType?.toLowerCase();
  const dealLabel = formatDealType(listing.dealType) || "For sale";
  const PropertyTypeIcon = getPropertyTypeIcon(listing.propertyType);
  const cityLabel = listing.city || listing.location;
  const townshipLabel = listing.township || listing.district || "Township TBD";
  const areaLabel = formatArea(listing.areaSqft);
  return (
    <Link href={`/listing/${listing.id}`} aria-label={listing.title}>
      <Card>
        <Cover>
          {listing.imageUrl ? (
            <img src={listing.imageUrl} alt={listing.title} />
          ) : (
            <span>No photo</span>
          )}
          <DealRibbon $dealType={normalizedDealType}>{dealLabel}</DealRibbon>
          <PricePill>{formatCurrency(listing.price, listing.currency)}</PricePill>
        </Cover>
        <Content>
          <LeftStack>
            <Title>{listing.title}</Title>
            <InfoRow>
              <MapPin />
              {townshipLabel}
            </InfoRow>
            <InfoRow>
              <Landmark />
              {cityLabel || "City TBD"}
            </InfoRow>
           
            {areaLabel ? (
              <InfoRow>
                <Ruler />
                {areaLabel}
              </InfoRow>
            ) : null}
          </LeftStack>
          <PropertyTypeTag>
            <PropertyTypeIcon size={20} />
            <span>{formatPropertyType(listing.propertyType) || "Property"}</span>
          </PropertyTypeTag>
        </Content>
      </Card>
    </Link>
  );
}
