"use client";

import { useEffect, useMemo, useState } from "react";
import { getListings, type Listing, type ListingFilters } from "@/app/living-site/lib/data";

export function useListings(filters?: ListingFilters) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const stableFilters = useMemo<ListingFilters | undefined>(
    () => (filters ? { ...filters } : undefined),
    [filters]
  );

  useEffect(() => {
    let active = true;

    setLoading(true);
    getListings(stableFilters)
      .then((data) => {
        if (active) {
          setListings(data);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [stableFilters]);

  return { listings, loading };
}
