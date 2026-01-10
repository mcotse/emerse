"use client";

import { useState, useCallback } from "react";

interface DeleteResult {
  success: boolean;
  deletedCount: number;
  deletedIds: string[];
  error?: string;
}

interface UsePhotoDeleteOptions {
  onSuccess?: (deletedIds: string[]) => void;
  onError?: (error: string) => void;
}

export function usePhotoDelete({ onSuccess, onError }: UsePhotoDeleteOptions = {}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deletePhotos = useCallback(
    async (photoIds: string[]): Promise<DeleteResult> => {
      if (photoIds.length === 0) {
        return { success: false, deletedCount: 0, deletedIds: [], error: "No photos to delete" };
      }

      setIsDeleting(true);
      setError(null);

      try {
        const response = await fetch("/api/photos/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoIds }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete photos");
        }

        const result: DeleteResult = await response.json();

        if (result.success) {
          onSuccess?.(result.deletedIds);
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete photos";
        setError(errorMessage);
        onError?.(errorMessage);
        return {
          success: false,
          deletedCount: 0,
          deletedIds: [],
          error: errorMessage,
        };
      } finally {
        setIsDeleting(false);
      }
    },
    [onSuccess, onError]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    deletePhotos,
    isDeleting,
    error,
    clearError,
  };
}

/**
 * Get the appropriate message for the deletion confirmation
 */
export function getDeleteConfirmationMessage(count: number): {
  title: string;
  message: string;
} {
  if (count === 1) {
    return {
      title: "Delete photo?",
      message: "This photo will be permanently deleted. This action cannot be undone.",
    };
  }
  return {
    title: `Delete ${count} photos?`,
    message: `These ${count} photos will be permanently deleted. This action cannot be undone.`,
  };
}
