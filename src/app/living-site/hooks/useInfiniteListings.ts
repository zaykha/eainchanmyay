"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Listing, ListingFilters } from "@/app/living-site/lib/data";

const pageSize = 6;

type ApiResponse = {
  data: Listing[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

const buildQuery = (filters?: ListingFilters, page?: number) => {
  const params = new URLSearchParams();
  if (filters?.query?.trim()) params.set("q", filters.query.trim());
  if (filters?.dealType) params.set("deal", filters.dealType);
  if (filters?.propertyType) params.set("type", filters.propertyType);
  if (filters?.stateRegion?.trim()) params.set("state", filters.stateRegion.trim());
  if (filters?.district?.trim()) params.set("district", filters.district.trim());
  if (filters?.township?.trim()) params.set("township", filters.township.trim());
  if (typeof filters?.minPrice === "number") params.set("minPrice", String(filters.minPrice));
  if (typeof filters?.maxPrice === "number") params.set("maxPrice", String(filters.maxPrice));
  if (typeof filters?.bedrooms === "number") params.set("beds", String(filters.bedrooms));
  if (typeof filters?.bathrooms === "number") params.set("baths", String(filters.bathrooms));
  if (typeof filters?.minAreaSqft === "number") params.set("minArea", String(filters.minAreaSqft));
  if (typeof filters?.maxAreaSqft === "number") params.set("maxArea", String(filters.maxAreaSqft));
  params.set("page", String(page ?? 1));
  params.set("pageSize", String(pageSize));
  return params.toString();
};

export function useInfiniteListings(filters?: ListingFilters) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const filterKey = useMemo(() => JSON.stringify(filters ?? {}), [filters]);

  const fetchPage = useCallback(
    async (pageToLoad: number) => {
      const query = buildQuery(filters, pageToLoad);
      const response = await fetch(`/api/listings?${query}`);
      if (!response.ok) {
        throw new Error("Unable to load listings.");
      }
      return (await response.json()) as ApiResponse;
    },
    [filters]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setHasMore(true);
    setPage(1);
    fetchPage(1)
      .then((result) => {
        if (!active) return;
        setListings(result.data ?? []);
        setHasMore(Boolean(result.hasMore));
      })
      .catch(() => {
        if (!active) return;
        setListings([]);
        setHasMore(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchPage, filterKey]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const result = await fetchPage(nextPage);
      setListings((current) => [...current, ...(result.data ?? [])]);
      setHasMore(Boolean(result.hasMore));
      setPage(nextPage);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loading, loadingMore, page]);

  return { listings, loading, loadingMore, hasMore, loadMore };
}
