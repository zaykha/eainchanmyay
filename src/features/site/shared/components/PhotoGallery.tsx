"use client";

import styled from "styled-components";
import { resolvePhotoUrl } from "@/app/living-site/lib/images";

const Gallery = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));

  img {
    width: 100%;
    height: 100%;
    border-radius: 16px;
    object-fit: cover;
    border: 1px solid var(--color-outline);
    box-shadow: var(--shadow-soft);
  }
`;

const Placeholder = styled.div`
  min-height: 180px;
  background: var(--color-surface);
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
  box-shadow: var(--shadow-soft);
`;

type PhotoGalleryProps = {
  photos: Record<string, unknown>[];
  fallback?: string;
};

export function PhotoGallery({ photos, fallback }: PhotoGalleryProps) {
  const items = photos
    .map((photo) => resolvePhotoUrl(photo))
    .filter((url): url is string => Boolean(url));

  const galleryItems = items.length ? items : fallback ? [fallback] : [];

  if (!galleryItems.length) {
    return <Placeholder>No photos available.</Placeholder>;
  }

  return (
    <Gallery>
      {galleryItems.map((url) => (
        <img key={url} src={url} alt="Listing photo" />
      ))}
    </Gallery>
  );
}
