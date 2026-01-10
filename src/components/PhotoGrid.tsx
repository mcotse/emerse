"use client";

import Image from "next/image";
import { useRef, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface Photo {
  id: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  alt?: string;
}

interface PhotoGridProps {
  photos: Photo[];
  columns?: number;
  onPhotoClick?: (photo: Photo, index: number) => void;
}

export function PhotoGrid({
  photos,
  columns = 3,
  onPhotoClick,
}: PhotoGridProps) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <div
      className="grid gap-0.5"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {photos.map((photo, index) => (
        <PhotoGridItem
          key={photo.id}
          photo={photo}
          onClick={() => onPhotoClick?.(photo, index)}
        />
      ))}
    </div>
  );
}

interface PhotoGridItemProps {
  photo: Photo;
  onClick?: () => void;
}

function PhotoGridItem({ photo, onClick }: PhotoGridItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative aspect-square overflow-hidden bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:bg-gray-900 dark:focus:ring-white"
    >
      {!isLoaded && <PhotoSkeleton />}
      <Image
        src={photo.thumbnailUrl}
        alt={photo.alt ?? "Photo"}
        fill
        sizes={`(max-width: 768px) ${100 / 3}vw, ${100 / 4}vw`}
        className={`object-cover transition-opacity duration-200 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setIsLoaded(true)}
      />
    </button>
  );
}

function PhotoSkeleton() {
  return (
    <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-800" />
  );
}

// Loading skeleton for the entire grid
interface PhotoGridSkeletonProps {
  count?: number;
  columns?: number;
}

export function PhotoGridSkeleton({
  count = 12,
  columns = 3,
}: PhotoGridSkeletonProps) {
  return (
    <div
      className="grid gap-0.5"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse bg-gray-200 dark:bg-gray-800"
        />
      ))}
    </div>
  );
}

/**
 * Virtualized photo grid for handling large photo libraries (1K-10K+ photos).
 * Only renders visible rows plus overscan for smooth scrolling.
 */
interface VirtualizedPhotoGridProps {
  photos: Photo[];
  columns?: number;
  gap?: number;
  onPhotoClick?: (photo: Photo, index: number) => void;
}

export function VirtualizedPhotoGrid({
  photos,
  columns = 3,
  gap = 2,
  onPhotoClick,
}: VirtualizedPhotoGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate row count
  const rowCount = Math.ceil(photos.length / columns);

  // Calculate row height based on viewport width and columns
  const getRowHeight = useCallback(() => {
    if (typeof window === "undefined") return 120;
    // Each cell is square, so height = width / columns
    const containerWidth = parentRef.current?.clientWidth ?? window.innerWidth;
    const cellWidth = (containerWidth - gap * (columns - 1)) / columns;
    return cellWidth + gap;
  }, [columns, gap]);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: getRowHeight,
    overscan: 5, // Render 5 extra rows above/below viewport
  });

  if (photos.length === 0) {
    return null;
  }

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-3.5rem)] overflow-auto"
      style={{ contain: "strict" }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowStartIndex = virtualRow.index * columns;
          const rowPhotos = photos.slice(rowStartIndex, rowStartIndex + columns);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                className="grid h-full"
                style={{
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: `${gap}px`,
                }}
              >
                {rowPhotos.map((photo, cellIndex) => {
                  const globalIndex = rowStartIndex + cellIndex;
                  return (
                    <PhotoGridItem
                      key={photo.id}
                      photo={photo}
                      onClick={() => onPhotoClick?.(photo, globalIndex)}
                    />
                  );
                })}
                {/* Fill empty cells in last row */}
                {rowPhotos.length < columns &&
                  Array.from({ length: columns - rowPhotos.length }).map(
                    (_, i) => <div key={`empty-${i}`} className="aspect-square" />
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
