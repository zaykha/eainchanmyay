"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapClickHandler({
  active,
  onSelect,
}: {
  active: boolean;
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (!active) return;
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({
  position,
  center,
  defaultZoom,
}: {
  position: [number, number] | null;
  center: [number, number];
  defaultZoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, Math.max(map.getZoom(), 14));
    } else {
      map.setView(center, defaultZoom);
    }
  }, [map, position, center, defaultZoom]);

  return null;
}

export default function RequestSaleMap({
  center,
  defaultZoom,
  active,
  position,
  onSelect,
}: {
  center: [number, number];
  defaultZoom: number;
  active: boolean;
  position: [number, number] | null;
  onSelect: (lat: number, lng: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    setMapKey((prev) => prev + 1);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <MapContainer
      key={mapKey}
      center={position ?? center}
      zoom={position ? 14 : defaultZoom}
      scrollWheelZoom
      doubleClickZoom
      dragging
      touchZoom
      boxZoom
      keyboard
      zoomControl
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {position && (
        <Marker
          position={position}
          draggable={active}
          icon={markerIcon}
          eventHandlers={{
            dragend: (event: L.DragEndEvent) => {
              if (!active) return;
              const marker = event.target as L.Marker;
              const latlng = marker.getLatLng();
              onSelect(latlng.lat, latlng.lng);
            },
          }}
        />
      )}
      <MapClickHandler active={active} onSelect={onSelect} />
      <MapUpdater position={position} center={center} defaultZoom={defaultZoom} />
    </MapContainer>
  );
}
