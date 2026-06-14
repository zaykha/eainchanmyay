"use client";

import styled from "styled-components";
import type { Listing } from "@/features/site/shared/lib/data";
import { ListingCard } from "@/features/site/shared/components/ListingCard";
import { LoadingOverlay } from "@/features/site/shared/components/LoadingOverlay";
import { useI18n } from "@/features/site/shared/lib/i18n";

const Grid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 320px));
  justify-content: center;
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
  const { t } = useI18n();
  if (loading) {
    return <LoadingOverlay message={t("listing.loading")} />;
  }

  if (!listings.length) {
    return <EmptyState>{t("listing.empty")}</EmptyState>;
  }

  return (
    <Grid>
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </Grid>
  );
}
