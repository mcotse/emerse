"use client";

import { useState, useCallback } from "react";

interface DownloadProgress {
  current: number;
  total: number;
  currentFile?: string;
}

interface UsePhotoDownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  onComplete?: (downloadedCount: number) => void;
  onError?: (error: string) => void;
}

export function usePhotoDownload({
  onProgress,
  onComplete,
  onError,
}: UsePhotoDownloadOptions = {}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Download a single photo
   */
  const downloadSingle = useCallback(
    async (photoId: string): Promise<boolean> => {
      setIsDownloading(true);
      setError(null);

      try {
        // Get download URL from API
        const response = await fetch(`/api/photos/download?id=${photoId}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to get download URL");
        }

        const { downloadUrl, filename } = await response.json();

        // Fetch the actual image
        const imageResponse = await fetch(downloadUrl);
        if (!imageResponse.ok) {
          throw new Error("Failed to download image");
        }

        const blob = await imageResponse.blob();

        // Trigger browser download
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

        onComplete?.(1);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Download failed";
        setError(errorMessage);
        onError?.(errorMessage);
        return false;
      } finally {
        setIsDownloading(false);
      }
    },
    [onComplete, onError]
  );

  /**
   * Download multiple photos (downloads them sequentially)
   */
  const downloadBatch = useCallback(
    async (photoIds: string[]): Promise<number> => {
      if (photoIds.length === 0) return 0;

      setIsDownloading(true);
      setError(null);

      let downloadedCount = 0;
      const total = photoIds.length;

      try {
        // Get download URLs from API
        const response = await fetch(`/api/photos/download?ids=${photoIds.join(",")}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to get download URLs");
        }

        const { downloads } = await response.json();

        // Download each file
        for (let i = 0; i < downloads.length; i++) {
          const { url, filename } = downloads[i];

          setProgress({ current: i + 1, total, currentFile: filename });
          onProgress?.({ current: i + 1, total, currentFile: filename });

          try {
            // Fetch the image
            const imageResponse = await fetch(url);
            if (!imageResponse.ok) continue;

            const blob = await imageResponse.blob();

            // Trigger browser download
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);

            downloadedCount++;

            // Small delay between downloads to avoid overwhelming the browser
            if (i < downloads.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          } catch {
            // Continue with next file on individual failure
            console.error(`Failed to download ${filename}`);
          }
        }

        onComplete?.(downloadedCount);
        return downloadedCount;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Download failed";
        setError(errorMessage);
        onError?.(errorMessage);
        return downloadedCount;
      } finally {
        setIsDownloading(false);
        setProgress(null);
      }
    },
    [onProgress, onComplete, onError]
  );

  /**
   * Download photos - single or batch based on count
   */
  const downloadPhotos = useCallback(
    async (photoIds: string[]): Promise<number> => {
      if (photoIds.length === 0) return 0;
      if (photoIds.length === 1) {
        const success = await downloadSingle(photoIds[0]);
        return success ? 1 : 0;
      }
      return downloadBatch(photoIds);
    },
    [downloadSingle, downloadBatch]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    downloadSingle,
    downloadBatch,
    downloadPhotos,
    isDownloading,
    progress,
    error,
    clearError,
  };
}

/**
 * Format download progress as a string
 */
export function formatDownloadProgress(progress: DownloadProgress): string {
  return `Downloading ${progress.current} of ${progress.total}...`;
}
