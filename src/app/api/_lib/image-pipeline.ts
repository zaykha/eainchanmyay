import sharp from "sharp";

const MAX_UPLOAD_WIDTH = 1600;
const WEBP_QUALITY = 80;

function sanitizeFilenameStem(value: string) {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "") || "image";
}

export function getOptimizedImageFilename(filename: string) {
  return `${sanitizeFilenameStem(filename)}.webp`;
}

export async function optimizeImageBuffer(input: {
  buffer: Buffer;
}) {
  return sharp(input.buffer)
    .rotate()
    .resize({
      width: MAX_UPLOAD_WIDTH,
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

export const optimizedImageContentType = "image/webp";
