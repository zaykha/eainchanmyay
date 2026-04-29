"use client";

import { useEffect, useState } from "react";
import { getListingDetail, type ListingDetail } from "@/app/living-site/lib/data";

const detailCache = new Map<string, ListingDetail | null>();

export function useListingDetail(propertyId?: string) {
  const [detail, setDetail] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) {
      setDetail(null);
      setLoading(false);
      return;
    }

    let active = true;
    const cached = detailCache.get(propertyId);

    if (cached !== undefined) {
      setDetail(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    getListingDetail(propertyId)
      .then((data) => {
        if (active) {
          detailCache.set(propertyId, data);
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
