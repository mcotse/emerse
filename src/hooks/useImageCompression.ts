import imageCompression from "browser-image-compression";

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  onProgress?: (progress: number) => void;
}

export interface CompressionResult {
  original: File;
  compressed: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 2,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
};

/**
 * Compress an image file before upload.
 * Reduces file size while maintaining acceptable quality.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // Skip compression for small files (< 500KB)
  if (file.size < 500 * 1024) {
    return {
      original: file,
      compressed: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    };
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: mergedOptions.maxSizeMB,
    maxWidthOrHeight: mergedOptions.maxWidthOrHeight,
    useWebWorker: mergedOptions.useWebWorker,
    onProgress: mergedOptions.onProgress,
  });

  // Preserve original filename with compressed extension
  const compressedFile = new File([compressed], file.name, {
    type: compressed.type,
    lastModified: Date.now(),
  });

  return {
    original: file,
    compressed: compressedFile,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    compressionRatio: file.size / compressedFile.size,
  };
}

/**
 * Compress multiple images in parallel.
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
