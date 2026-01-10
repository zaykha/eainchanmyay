type PhotoLike = Record<string, unknown>;

type PropertyLike = Record<string, unknown>;

export const resolveImage = (url?: string | null) => {
  if (!url) return null;
  const trimmed = url.trim().replace(/^['"]|['"]$/g, "");
  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE?.replace(/\/+$/, "");
  const supaBase = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");

  if (/^https?:\/\//i.test(trimmed)) {
    if (r2Base && /r2\.cloudflarestorage\.com/i.test(trimmed)) {
      try {
        const parsed = new URL(trimmed);
        return `${r2Base}/${parsed.pathname.replace(/^\/+/, "")}`;
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  if (r2Base) {
    return `${r2Base}/${trimmed.replace(/^\/+/, "")}`;
  }

  if (supaBase && trimmed.startsWith("/storage")) {
    return `${supaBase}${trimmed}`;
  }

  if (supaBase && trimmed.startsWith("items/")) {
    return `${supaBase}/storage/v1/object/public/item-images/${trimmed}`;
  }

  return trimmed;
};

export function resolvePhotoUrl(photo: PhotoLike | null | undefined) {
  if (!photo) return undefined;
  const candidate =
    (photo.url as string) ||
    (photo.image_url as string) ||
    (photo.photo_url as string) ||
    (photo.public_url as string) ||
    undefined;

  return resolveImage(candidate) ?? undefined;
}

export function resolveListingImage(
  property: PropertyLike,
  photos: PhotoLike[]
) {
  const coverPhoto = photos.find((photo) => photo.is_cover === true);
  const firstPhoto = photos.find((photo) => resolvePhotoUrl(photo));
  return (
    resolvePhotoUrl(coverPhoto) ||
    resolvePhotoUrl(firstPhoto) ||
    resolveImage(property.image_url as string) ||
    resolveImage(property.cover_image as string) ||
    undefined
  );
}
