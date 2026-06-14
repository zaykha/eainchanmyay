type PhotoLike = Record<string, unknown>;

type PropertyLike = Record<string, unknown>;

export const resolveImage = (url?: string | null) => {
  if (!url) return null;
  const trimmed = url.trim().replace(/^['"]|['"]$/g, "");
  const supaBase = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const propertyBucket = process.env.NEXT_PUBLIC_SUPABASE_PROPERTY_IMAGE_BUCKET?.trim() || "item-images";
  const requestBucket = process.env.NEXT_PUBLIC_SUPABASE_REQUEST_IMAGE_BUCKET?.trim() || "sales-request-images";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (supaBase && trimmed.startsWith("/storage")) {
    return `${supaBase}${trimmed}`;
  }

  if (supaBase && trimmed.startsWith("sales-requests/")) {
    return `${supaBase}/storage/v1/object/public/${requestBucket}/${trimmed}`;
  }

  if (supaBase && trimmed.startsWith("vendor-imports/")) {
    return `${supaBase}/storage/v1/object/public/${propertyBucket}/${trimmed}`;
  }

  if (supaBase && trimmed.startsWith("items/")) {
    return `${supaBase}/storage/v1/object/public/${propertyBucket}/${trimmed}`;
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
