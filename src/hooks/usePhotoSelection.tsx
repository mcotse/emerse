"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

interface PhotoSelectionContextValue {
  selectedIds: Set<string>;
  isSelectionMode: boolean;
  selectedCount: number;
  toggleSelection: (photoId: string) => void;
  selectAll: (photoIds: string[]) => void;
  deselectAll: () => void;
  selectRange: (startId: string, endId: string, allIds: string[]) => void;
  isSelected: (photoId: string) => boolean;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
}

const PhotoSelectionContext = createContext<PhotoSelectionContextValue | null>(null);

interface PhotoSelectionProviderProps {
  children: ReactNode;
}

export function PhotoSelectionProvider({ children }: PhotoSelectionProviderProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const selectedCount = selectedIds.size;

  const toggleSelection = useCallback((photoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((photoIds: string[]) => {
    setSelectedIds(new Set(photoIds));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectRange = useCallback((startId: string, endId: string, allIds: string[]) => {
    const startIndex = allIds.indexOf(startId);
    const endIndex = allIds.indexOf(endId);

    if (startIndex === -1 || endIndex === -1) return;

    const [from, to] = startIndex < endIndex
      ? [startIndex, endIndex]
      : [endIndex, startIndex];

    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (let i = from; i <= to; i++) {
        next.add(allIds[i]);
      }
      return next;
    });
  }, []);

  const isSelected = useCallback(
    (photoId: string) => selectedIds.has(photoId),
    [selectedIds]
  );

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const value = useMemo(
    () => ({
      selectedIds,
      isSelectionMode,
      selectedCount,
      toggleSelection,
      selectAll,
      deselectAll,
      selectRange,
      isSelected,
      enterSelectionMode,
      exitSelectionMode,
    }),
    [
      selectedIds,
      isSelectionMode,
      selectedCount,
      toggleSelection,
      selectAll,
      deselectAll,
      selectRange,
      isSelected,
      enterSelectionMode,
      exitSelectionMode,
    ]
  );

  return (
    <PhotoSelectionContext.Provider value={value}>
      {children}
    </PhotoSelectionContext.Provider>
  );
}

export function usePhotoSelection() {
  const context = useContext(PhotoSelectionContext);
  if (!context) {
    throw new Error("usePhotoSelection must be used within a PhotoSelectionProvider");
  }
  return context;
}

/**
 * Hook for getting selected photo IDs as an array
 */
export function useSelectedPhotoIds(): string[] {
  const { selectedIds } = usePhotoSelection();
  return useMemo(() => Array.from(selectedIds), [selectedIds]);
}
