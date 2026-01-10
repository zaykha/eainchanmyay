"use client";

import styled from "styled-components";
import type { Listing } from "@/app/living-site/lib/data";
import { ListingCard } from "@/app/living-site/components/ListingCard";

const Grid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 320px));
  justify-content: start;
`;

const EmptyState = styled.div`
  padding: 24px;
  border: 1px dashed var(--color-outline);
  border-radius: 16px;
  text-align: center;
  color: var(--color-muted);
  background: color-mix(in srgb, var(--color-surface) 85%, transparent);
`;

type ListingGridProps = {
  listings: Listing[];
  loading?: boolean;
};

export function ListingGrid({ listings, loading }: ListingGridProps) {
  if (loading) {
    return <EmptyState>Loading listings...</EmptyState>;
  }

  if (!listings.length) {
    return <EmptyState>No properties match your search yet.</EmptyState>;
  }

  return (
    <Grid>
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </Grid>
  );
}
