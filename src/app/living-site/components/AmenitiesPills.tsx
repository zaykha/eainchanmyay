"use client";

import type { ComponentType } from "react";
import styled from "styled-components";
import {
  Wifi,
  Utensils,
  Snowflake,
  ThermometerSun,
  WashingMachine,
  Wind,
  Tv,
  Laptop,
  ParkingSquare,
  ArrowUpDown,
  Flame,
  Package,
  Shirt,
  AlertTriangle,
  Bandage,
  FireExtinguisher,
  Sparkles,
} from "lucide-react";

const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Pill = styled.span`
  background: var(--color-surface);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.85rem;
  border: 1px solid var(--color-outline);
  box-shadow: 0 4px 10px rgba(12, 18, 36, 0.08);
  display: inline-flex;
  align-items: center;
  gap: 6px;

  svg {
    width: 14px;
    height: 14px;
    stroke: currentColor;
  }
`;

type AmenityItem = {
  key: string;
  label: string;
};

type AmenitiesPillsProps = {
  amenities: AmenityItem[];
};

const amenityIcons: Record<string, ComponentType<{ size?: number }>> = {
  wifi: Wifi,
  kitchen: Utensils,
  air_conditioning: Snowflake,
  heating: ThermometerSun,
  washer: WashingMachine,
  dryer: Wind,
  tv: Tv,
  workspace: Laptop,
  parking: ParkingSquare,
  elevator: ArrowUpDown,
  hot_water: Flame,
  essentials: Package,
  hair_dryer: Wind,
  iron: Shirt,
  smoke_detector: AlertTriangle,
  co_detector: AlertTriangle,
  first_aid: Bandage,
  fire_extinguisher: FireExtinguisher,
};

export function AmenitiesPills({ amenities }: AmenitiesPillsProps) {
  if (!amenities.length) {
    return <p>No amenities listed yet.</p>;
  }

  return (
    <Pills>
      {amenities.map((amenity) => {
        const Icon = amenityIcons[amenity.key] ?? Sparkles;
        return (
          <Pill key={`${amenity.key}-${amenity.label}`}>
            <Icon size={14} />
            {amenity.label}
          </Pill>
        );
      })}
    </Pills>
  );
}
