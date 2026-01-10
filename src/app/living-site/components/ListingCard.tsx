"use client";

import Link from "next/link";
import { Home, MapPin } from "lucide-react";
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
`;

const Content = styled.div`
  padding: 16px;
  display: grid;
  gap: 8px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.05rem;
`;

const Meta = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: 0.9rem;
`;

const Price = styled.p`
  margin: 0;
  font-weight: 600;
  color: var(--color-primary);
`;

const PriceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const TagRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-muted);
  font-size: 0.85rem;

  svg {
    width: 14px;
    height: 14px;
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

export function ListingCard({ listing }: ListingCardProps) {
  const location = [listing.township, listing.district].filter(Boolean).join(", ");
  return (
    <Link href={`/listing/${listing.id}`} aria-label={listing.title}>
      <Card>
        <Cover>
          {listing.imageUrl ? (
            <img src={listing.imageUrl} alt={listing.title} />
          ) : (
            <span>No photo</span>
          )}
        </Cover>
        <Content>
          <Title>{listing.title}</Title>
          <Meta>{location || listing.location}</Meta>
          <PriceRow>
            <Price>{formatCurrency(listing.price, listing.currency)}</Price>
            <TagRow>
              <Home size={14} />
              {formatPropertyType(listing.propertyType) || "Property"}
            </TagRow>
          </PriceRow>
          <TagRow>
            <MapPin size={14} />
            {formatDealType(listing.dealType) || "For sale"}
          </TagRow>
        </Content>
      </Card>
    </Link>
  );
}
