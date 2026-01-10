"use client";

import { useEffect, useState } from "react";
import { getListingDetail, type ListingDetail } from "@/app/living-site/lib/data";

export function useListingDetail(propertyId?: string) {
  const [detail, setDetail] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    getListingDetail(propertyId)
      .then((data) => {
        if (active) {
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
