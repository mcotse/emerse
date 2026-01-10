"use client";

import Image from "next/image";
import { useRef, useState, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { PhotoCluster, PhotoWithDate } from "@/lib/clustering";

export interface Photo {
  id: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  alt?: string;
  blurDataURL?: string;
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
  const hasBlur = Boolean(photo.blurDataURL);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative aspect-square overflow-hidden bg-gray-100 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:bg-gray-900 dark:focus:ring-white"
      aria-label={photo.alt || "View photo"}
    >
      {!isLoaded && !hasBlur && <PhotoSkeleton />}
      <Image
        src={photo.thumbnailUrl}
        alt={photo.alt ?? "Photo"}
        fill
        sizes={`(max-width: 768px) ${100 / 3}vw, ${100 / 4}vw`}
        className={`object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : hasBlur ? "opacity-100" : "opacity-0"
        }`}
        placeholder={hasBlur ? "blur" : "empty"}
        blurDataURL={photo.blurDataURL}
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

/**
 * Clustered photo grid with section headers.
 * Groups photos by date with virtualized scrolling.
 */

type ClusterRowItem =
  | { type: "header"; cluster: PhotoCluster }
  | { type: "photos"; photos: PhotoWithDate[]; clusterIndex: number; rowInCluster: number };

interface ClusteredPhotoGridProps {
  clusters: PhotoCluster[];
  columns?: number;
  gap?: number;
  onPhotoClick?: (photo: PhotoWithDate, globalIndex: number) => void;
}

export function ClusteredPhotoGrid({
  clusters,
  columns = 3,
  gap = 2,
  onPhotoClick,
}: ClusteredPhotoGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Build flat list of rows (headers + photo rows)
  const rows = useMemo(() => {
    const items: ClusterRowItem[] = [];

    for (let clusterIndex = 0; clusterIndex < clusters.length; clusterIndex++) {
      const cluster = clusters[clusterIndex];

      // Add header row
      items.push({ type: "header", cluster });

      // Add photo rows
      const rowCount = Math.ceil(cluster.photos.length / columns);
      for (let row = 0; row < rowCount; row++) {
        const startIdx = row * columns;
        const rowPhotos = cluster.photos.slice(startIdx, startIdx + columns);
        items.push({
          type: "photos",
          photos: rowPhotos,
          clusterIndex,
          rowInCluster: row,
        });
      }
    }

    return items;
  }, [clusters, columns]);

  // Calculate row heights
  const getRowHeight = useCallback(
    (index: number) => {
      const row = rows[index];
      if (row.type === "header") {
        return 56; // Header height
      }
      if (typeof window === "undefined") return 120;
      const containerWidth = parentRef.current?.clientWidth ?? window.innerWidth;
      const cellWidth = (containerWidth - gap * (columns - 1)) / columns;
      return cellWidth + gap;
    },
    [rows, columns, gap]
  );

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: getRowHeight,
    overscan: 5,
  });

  // Calculate global photo index for a given position
  const getGlobalPhotoIndex = useCallback(
    (clusterIndex: number, photoIndexInCluster: number) => {
      let index = 0;
      for (let i = 0; i < clusterIndex; i++) {
        index += clusters[i].photos.length;
      }
      return index + photoIndexInCluster;
    },
    [clusters]
  );

  if (clusters.length === 0) {
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
          const row = rows[virtualRow.index];

          if (row.type === "header") {
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
                <ClusterHeader cluster={row.cluster} />
              </div>
            );
          }

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
                {row.photos.map((photo, cellIndex) => {
                  const photoIndexInCluster = row.rowInCluster * columns + cellIndex;
                  const globalIndex = getGlobalPhotoIndex(row.clusterIndex, photoIndexInCluster);
                  return (
                    <PhotoGridItem
                      key={photo.id}
                      photo={photo}
                      onClick={() => onPhotoClick?.(photo, globalIndex)}
                    />
                  );
                })}
                {row.photos.length < columns &&
                  Array.from({ length: columns - row.photos.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ClusterHeaderProps {
  cluster: PhotoCluster;
}

function ClusterHeader({ cluster }: ClusterHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex h-14 items-center bg-white/90 px-4 backdrop-blur-sm dark:bg-black/90">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          {cluster.label}
        </h2>
        {cluster.sublabel && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{cluster.sublabel}</p>
        )}
      </div>
      <span className="ml-auto text-xs text-gray-400">
        {cluster.photos.length} photo{cluster.photos.length !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
