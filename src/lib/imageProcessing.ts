import sharp from "sharp";

/**
 * Image resolution variants for responsive loading
 */
export const IMAGE_RESOLUTIONS = {
  thumbnail: { width: 200, height: 200, quality: 70 },
  small: { width: 400, height: 400, quality: 75 },
  medium: { width: 800, height: 800, quality: 80 },
  large: { width: 1600, height: 1600, quality: 85 },
  original: { quality: 90 },
} as const;

export type ResolutionName = keyof typeof IMAGE_RESOLUTIONS;

export interface ProcessedImage {
  resolution: ResolutionName;
  buffer: Buffer;
  width: number;
  height: number;
  format: "webp" | "jpeg";
  size: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
}

/**
 * Extract metadata from an image buffer
 */
export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    format: metadata.format ?? "unknown",
    size: buffer.length,
    hasAlpha: metadata.hasAlpha ?? false,
  };
}

/**
 * Generate a single resolution variant of an image
 */
export async function generateResolution(
  buffer: Buffer,
  resolution: ResolutionName,
  outputFormat: "webp" | "jpeg" = "webp"
): Promise<ProcessedImage> {
  const config = IMAGE_RESOLUTIONS[resolution];

  let pipeline = sharp(buffer);

  // Resize for non-original resolutions
  if (resolution !== "original" && "width" in config) {
    pipeline = pipeline.resize(config.width, config.height, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Apply output format
  if (outputFormat === "webp") {
    pipeline = pipeline.webp({ quality: config.quality });
  } else {
    pipeline = pipeline.jpeg({ quality: config.quality, mozjpeg: true });
  }

  const outputBuffer = await pipeline.toBuffer();
  const outputMetadata = await sharp(outputBuffer).metadata();

  return {
    resolution,
    buffer: outputBuffer,
    width: outputMetadata.width ?? 0,
    height: outputMetadata.height ?? 0,
    format: outputFormat,
    size: outputBuffer.length,
  };
}

/**
 * Generate all resolution variants of an image
 */
export async function generateAllResolutions(
  buffer: Buffer,
  outputFormat: "webp" | "jpeg" = "webp"
): Promise<ProcessedImage[]> {
  const resolutions: ResolutionName[] = [
    "thumbnail",
    "small",
    "medium",
    "large",
    "original",
  ];

  const results = await Promise.all(
    resolutions.map((resolution) =>
      generateResolution(buffer, resolution, outputFormat)
    )
  );

  return results;
}

/**
 * Generate a blur placeholder (tiny base64 image)
 */
export async function generateBlurPlaceholder(buffer: Buffer): Promise<string> {
  const blurBuffer = await sharp(buffer)
    .resize(10, 10, { fit: "inside" })
    .blur(1)
    .webp({ quality: 20 })
    .toBuffer();

  return `data:image/webp;base64,${blurBuffer.toString("base64")}`;
}

/**
 * Process an uploaded image and generate all variants
 */
export async function processUploadedImage(buffer: Buffer): Promise<{
  metadata: ImageMetadata;
  variants: ProcessedImage[];
  blurPlaceholder: string;
}> {
  const [metadata, variants, blurPlaceholder] = await Promise.all([
    getImageMetadata(buffer),
    generateAllResolutions(buffer),
    generateBlurPlaceholder(buffer),
  ]);

  return {
    metadata,
    variants,
    blurPlaceholder,
  };
}
