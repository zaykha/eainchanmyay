"use client";

import { useEffect, useState } from "react";
import type { ListingDetail } from "@/app/living-site/lib/data";

const detailCache = new Map<string, ListingDetail | null>();
const detailCachePrefix = "ecm_listing_detail_v2";
const detailCacheTtlMs = 10 * 60 * 1000;

function readDetailCache(propertyId: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${detailCachePrefix}:${propertyId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: ListingDetail | null };
    if (typeof parsed?.ts !== "number") return null;
    if (Date.now() - parsed.ts > detailCacheTtlMs) return null;
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

function writeDetailCache(propertyId: string, data: ListingDetail | null) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${detailCachePrefix}:${propertyId}`,
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch {
    // Ignore localStorage failures.
  }
}

export function useListingDetail(propertyId?: string) {
  const [detail, setDetail] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) {
      setDetail(null);
      setLoading(true);
      return;
    }

    let active = true;
    const memoryCached = detailCache.get(propertyId);
    const cached = memoryCached !== undefined ? memoryCached : readDetailCache(propertyId);

    if (cached !== undefined) {
      setDetail(cached);
      setLoading(false);
      if (memoryCached === undefined) {
        detailCache.set(propertyId, cached);
      }
    } else {
      setLoading(true);
    }

    fetch(`/api/public/listings/${encodeURIComponent(propertyId)}`)
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        return (await response.json()) as ListingDetail | null;
      })
      .then((data) => {
        if (active) {
          detailCache.set(propertyId, data);
          writeDetailCache(propertyId, data);
          setDetail(data);
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
  }, [propertyId]);

  return { detail, loading };
}
