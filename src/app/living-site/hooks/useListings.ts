"use client";

import { useEffect, useState } from "react";
import { getListings, type Listing, type ListingFilters } from "@/app/living-site/lib/data";

export function useListings(filters?: ListingFilters) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    setLoading(true);
    getListings(filters)
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
  }, [
    filters?.bathrooms,
    filters?.bedrooms,
    filters?.dealType,
    filters?.district,
    filters?.maxAreaSqft,
    filters?.maxPrice,
    filters?.minAreaSqft,
    filters?.minPrice,
    filters?.propertyType,
    filters?.query,
    filters?.stateRegion,
    filters?.township,
  ]);

  return { listings, loading };
}
