"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { createGlobalStyle } from "styled-components";
import { MapContainer, useMap, useMapEvents } from "react-leaflet";
import type { Listing } from "@/app/living-site/lib/data";
import type { ListingQueryBounds } from "@/app/living-site/hooks/useInfiniteListings";

const defaultCenter: [number, number] = [16.8661, 96.1951];
const defaultZoom = 12;
const toFiniteCoordinate = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const MarkerStyles = createGlobalStyle`
  .property-price-marker {
    background: transparent;
    border: none;
  }

  .property-price-marker__pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 48px;
    padding: 7px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid rgba(226, 56, 92, 0.18);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);
    color: #111827;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.01em;
    white-space: nowrap;
  }

  .property-price-marker--selected .property-price-marker__pill {
    background: linear-gradient(135deg, #ff4d73, #e11d48);
    border-color: rgba(255, 77, 115, 0.9);
    color: #fff;
    box-shadow: 0 16px 32px rgba(225, 29, 72, 0.32);
    transform: translateY(-2px);
  }
`;

type PropertyMapLeafletProps = {
  listings: Listing[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onBoundsChange: (bounds: ListingQueryBounds) => void;
  focusedListing: Listing | null;
};

const clampMarkerCount = 100;

const formatMarkerPrice = (listing: Listing) => {
  const value = listing.price;
  if (typeof value !== "number" || !Number.isFinite(value)) return "Contact";
  const isRent = String(listing.dealType ?? "").toLowerCase() === "rent";
  const absValue = Math.abs(value);
  const compactFormatter = (amount: number, digits: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    }).format(amount);

  const formatCompact = (amount: number, suffix: string, digits: number) => {
    const text = compactFormatter(amount, digits);
    return `${text}${suffix}`;
  };

  let label = "";
  if (absValue >= 1_000_000_000) {
    label = formatCompact(value / 1_000_000_000, "B", absValue >= 10_000_000_000 ? 0 : 1);
  } else if (absValue >= 100_000) {
    label = formatCompact(value / 100_000, "L", absValue >= 10_000_000 ? 0 : 1);
  } else if (absValue >= 1_000) {
    label = formatCompact(value / 1_000, "K", absValue >= 100_000 ? 0 : 1);
  } else {
    label = String(Math.round(value));
  }

  return isRent ? `${label}/mo` : label;
};

const createMarkerIcon = (priceLabel: string, selected: boolean) =>
  L.divIcon({
    className: `property-price-marker${selected ? " property-price-marker--selected" : ""}`,
    html: `<div class="property-price-marker__pill">${priceLabel}</div>`,
    iconAnchor: [28, 18],
  });

function ViewportController({
  listings,
  focusedListing,
  onBoundsChange,
}: {
  listings: Listing[];
  focusedListing: Listing | null;
  onBoundsChange: (bounds: ListingQueryBounds) => void;
}) {
  const map = useMap();
  const programmaticMoveRef = useRef(false);
  const fittedKeyRef = useRef("");

  const visibleListings = useMemo(
    () =>
      listings
        .filter(
          (listing) =>
            typeof listing.latitude === "number" &&
            typeof listing.longitude === "number" &&
            Number.isFinite(listing.latitude) &&
            Number.isFinite(listing.longitude)
        )
        .slice(0, clampMarkerCount),
    [listings]
  );

  const clearProgrammaticFlag = () => {
    window.setTimeout(() => {
      programmaticMoveRef.current = false;
    }, 260);
  };

  const focusedLatitude =
    focusedListing ? toFiniteCoordinate(focusedListing.latitude) : null;
  const focusedLongitude =
    focusedListing ? toFiniteCoordinate(focusedListing.longitude) : null;

  useEffect(() => {
    if (!focusedListing || focusedLatitude === null || focusedLongitude === null) {
      return;
    }
    programmaticMoveRef.current = true;
    try {
      map.flyTo([focusedLatitude, focusedLongitude], Math.max(map.getZoom(), 15), {
        duration: 0.45,
      });
    } catch {
      programmaticMoveRef.current = false;
      return;
    }
    clearProgrammaticFlag();
  }, [focusedLatitude, focusedListing, focusedLongitude, map]);

  useEffect(() => {
    if (!visibleListings.length) return;
    const nextKey = visibleListings
      .map((listing) => `${listing.id}:${listing.latitude}:${listing.longitude}`)
      .join("|");
    if (fittedKeyRef.current === nextKey) return;
    fittedKeyRef.current = nextKey;
    let bounds: L.LatLngBounds;
    try {
      bounds = L.latLngBounds(
        visibleListings.map((listing) => [listing.latitude as number, listing.longitude as number] as [number, number])
      );
    } catch {
      return;
    }
    programmaticMoveRef.current = true;
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    clearProgrammaticFlag();
  }, [map, visibleListings]);

  useMapEvents({
    moveend() {
      if (programmaticMoveRef.current) return;
      const bounds = map.getBounds();
      onBoundsChange({
        south: bounds.getSouth(),
        north: bounds.getNorth(),
        west: bounds.getWest(),
        east: bounds.getEast(),
      });
    },
    zoomend() {
      if (programmaticMoveRef.current) return;
      const bounds = map.getBounds();
      onBoundsChange({
        south: bounds.getSouth(),
        north: bounds.getNorth(),
        west: bounds.getWest(),
        east: bounds.getEast(),
      });
    },
  });

  return null;
}

function BaseTileLayer() {
  const map = useMap();

  useEffect(() => {
    const layer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    });
    let disposed = false;

    const attachLayer = () => {
      if (disposed) return;
      const container = typeof map.getContainer === "function" ? map.getContainer() : null;
      if (!container) return;
      try {
        layer.addTo(map);
      } catch {
        return;
      }
    };

    map.whenReady(attachLayer);

    return () => {
      disposed = true;
      try {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      } catch {
        return;
      }
    };
  }, [map]);

  return null;
}

function BottomRightZoomControl() {
  const map = useMap();

  useEffect(() => {
    const control = L.control.zoom({ position: "bottomright" });
    let disposed = false;

    const attachControl = () => {
      if (disposed) return;
      try {
        control.addTo(map);
      } catch {
        return;
      }
    };

    map.whenReady(attachControl);

    return () => {
      disposed = true;
      try {
        control.remove();
      } catch {
        return;
      }
    };
  }, [map]);

  return null;
}

function MarkerLayer({
  listings,
  selectedId,
  onSelect,
}: {
  listings: Listing[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const layerGroup = L.layerGroup();
    let disposed = false;

    const attachMarkers = () => {
      if (disposed) return;
      try {
        listings.forEach((listing) => {
          const marker = L.marker(
            [listing.latitude as number, listing.longitude as number],
            {
              icon: createMarkerIcon(
                formatMarkerPrice(listing),
                listing.id === selectedId
              ),
            }
          );
          marker.on("click", () => onSelect(listing.id));
          marker.addTo(layerGroup);
        });
        layerGroup.addTo(map);
      } catch {
        return;
      }
    };

    map.whenReady(attachMarkers);

    return () => {
      disposed = true;
      try {
        layerGroup.clearLayers();
        if (map.hasLayer(layerGroup)) {
          map.removeLayer(layerGroup);
        }
      } catch {
        return;
      }
    };
  }, [listings, map, onSelect, selectedId]);

  return null;
}

export default function PropertyMapLeaflet({
  listings,
  selectedId,
  onSelect,
  onBoundsChange,
  focusedListing,
}: PropertyMapLeafletProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const visibleListings = useMemo(
    () =>
      listings
        .filter(
          (listing) =>
            typeof listing.latitude === "number" &&
            typeof listing.longitude === "number" &&
            Number.isFinite(listing.latitude) &&
            Number.isFinite(listing.longitude)
        )
        .slice(0, clampMarkerCount),
    [listings]
  );

  if (!mounted) {
    return null;
  }

  return (
    <>
      <MarkerStyles />
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <BaseTileLayer />
        <BottomRightZoomControl />
        <ViewportController
          listings={visibleListings}
          focusedListing={focusedListing}
          onBoundsChange={onBoundsChange}
        />
        <MarkerLayer
          listings={visibleListings}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </MapContainer>
    </>
  );
}
