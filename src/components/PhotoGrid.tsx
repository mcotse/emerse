"use client";

import Image from "next/image";
import { useRef, useState, useCallback, useMemo, useEffect } from "react";
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
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
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
      className="flex-1 overflow-auto"
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
                className="grid"
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
  enableTransitions?: boolean;
  isSelectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (photoId: string) => void;
}

export function ClusteredPhotoGrid({
  clusters,
  columns = 3,
  gap = 2,
  onPhotoClick,
  enableTransitions = true,
  isSelectionMode = false,
  selectedIds = new Set(),
  onToggleSelection,
}: ClusteredPhotoGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const prevClustersRef = useRef<PhotoCluster[]>(clusters);
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure container width after mount and on resize
  useEffect(() => {
    const updateWidth = () => {
      if (parentRef.current) {
        setContainerWidth(parentRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Detect cluster changes and trigger transition
  useEffect(() => {
    const prevClusters = prevClustersRef.current;
    const hasChanged =
      prevClusters.length !== clusters.length ||
      prevClusters.some((c, i) => c.label !== clusters[i]?.label);

    if (hasChanged && enableTransitions) {
      setIsTransitioning(true);
      // Reset scroll position for new cluster mode
      if (parentRef.current) {
        parentRef.current.scrollTop = 0;
      }
      // Increment render key to force re-render with fresh animations
      setRenderKey((k) => k + 1);
      // End transition after animation completes
      const timer = setTimeout(() => setIsTransitioning(false), 300);
      return () => clearTimeout(timer);
    }
    prevClustersRef.current = clusters;
  }, [clusters, enableTransitions]);

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
      // Use measured containerWidth, fallback to reasonable default
      const width = containerWidth || (typeof window !== "undefined" ? window.innerWidth : 1280);
      const cellWidth = (width - gap * (columns - 1)) / columns;
      return cellWidth + gap;
    },
    [rows, columns, gap, containerWidth]
  );

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: getRowHeight,
    overscan: 5,
  });

  // Force re-measure when container width changes
  useEffect(() => {
    if (containerWidth > 0) {
      rowVirtualizer.measure();
    }
  }, [containerWidth, rowVirtualizer]);

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

  // Calculate staggered animation delay based on row index
  const getAnimationDelay = (index: number) => {
    if (!enableTransitions) return 0;
    return Math.min(index * 30, 300); // Cap at 300ms max delay
  };

  return (
    <div
      ref={parentRef}
      className={`min-h-0 flex-1 overflow-auto transition-opacity duration-200 ${
        isTransitioning ? "opacity-90" : "opacity-100"
      }`}
    >
      <div
        key={renderKey}
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          const animationDelay = getAnimationDelay(virtualRow.index);

          if (row.type === "header") {
            return (
              <div
                key={virtualRow.key}
                className="animate-cluster-fade-in"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  animationDelay: `${animationDelay}ms`,
                }}
              >
                <ClusterHeader cluster={row.cluster} isAnimating={enableTransitions} />
              </div>
            );
          }

          return (
            <div
              key={virtualRow.key}
              className="animate-cluster-fade-in"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                animationDelay: `${animationDelay}ms`,
              }}
            >
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: `${gap}px`,
                }}
              >
                {row.photos.map((photo, cellIndex) => {
                  const photoIndexInCluster = row.rowInCluster * columns + cellIndex;
                  const globalIndex = getGlobalPhotoIndex(row.clusterIndex, photoIndexInCluster);
                  return (
                    <AnimatedPhotoGridItem
                      key={photo.id}
                      photo={photo}
                      onClick={() => onPhotoClick?.(photo, globalIndex)}
                      animationDelay={animationDelay + cellIndex * 20}
                      enableAnimation={enableTransitions}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedIds.has(photo.id)}
                      onSelect={() => onToggleSelection?.(photo.id)}
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
  isAnimating?: boolean;
}

function ClusterHeader({ cluster, isAnimating }: ClusterHeaderProps) {
  return (
    <div
      className={`sticky top-0 z-10 flex h-14 items-center bg-white/90 px-4 backdrop-blur-sm dark:bg-black/90 ${
        isAnimating ? "animate-header-slide-in" : ""
      }`}
    >
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

/**
 * Animated photo grid item with staggered entrance animation
 */
interface AnimatedPhotoGridItemProps {
  photo: Photo;
  onClick?: () => void;
  animationDelay?: number;
  enableAnimation?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

function AnimatedPhotoGridItem({
  photo,
  onClick,
  animationDelay = 0,
  enableAnimation = true,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
}: AnimatedPhotoGridItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const hasBlur = Boolean(photo.blurDataURL);

  const handleClick = () => {
    if (isSelectionMode && onSelect) {
      onSelect();
    } else {
      onClick?.();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative aspect-square overflow-hidden bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:bg-gray-900 dark:focus:ring-white ${
        enableAnimation ? "animate-photo-scale-in" : ""
      } ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
      style={enableAnimation ? { animationDelay: `${animationDelay}ms` } : undefined}
      aria-label={photo.alt || "View photo"}
      aria-pressed={isSelectionMode ? isSelected : undefined}
    >
      {!isLoaded && !hasBlur && <PhotoSkeleton />}
      <Image
        src={photo.thumbnailUrl}
        alt={photo.alt ?? "Photo"}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
        className={`object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : hasBlur ? "opacity-100" : "opacity-0"
        } ${isSelected ? "brightness-90" : ""}`}
        placeholder={hasBlur ? "blur" : "empty"}
        blurDataURL={photo.blurDataURL}
        onLoad={() => setIsLoaded(true)}
      />
      {/* Selection indicator */}
      {isSelectionMode && (
        <div
          className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
            isSelected
              ? "border-blue-500 bg-blue-500 text-white"
              : "border-white bg-black/30 text-transparent"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}

/**
 * Selectable photo grid item for selection mode
 */
export interface SelectablePhotoGridItemProps {
  photo: Photo;
  onClick?: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function SelectablePhotoGridItem({
  photo,
  onClick,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
}: SelectablePhotoGridItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const hasBlur = Boolean(photo.blurDataURL);

  const handleClick = () => {
    if (isSelectionMode && onSelect) {
      onSelect();
    } else {
      onClick?.();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative aspect-square overflow-hidden bg-gray-100 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:bg-gray-900 dark:focus:ring-white ${
        isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
      }`}
      aria-label={photo.alt || "View photo"}
      aria-pressed={isSelectionMode ? isSelected : undefined}
    >
      {!isLoaded && !hasBlur && <PhotoSkeleton />}
      <Image
        src={photo.thumbnailUrl}
        alt={photo.alt ?? "Photo"}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
        className={`object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : hasBlur ? "opacity-100" : "opacity-0"
        } ${isSelected ? "brightness-90" : ""}`}
        placeholder={hasBlur ? "blur" : "empty"}
        blurDataURL={photo.blurDataURL}
        onLoad={() => setIsLoaded(true)}
      />
      {/* Selection indicator */}
      {isSelectionMode && (
        <div
          className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
            isSelected
              ? "border-blue-500 bg-blue-500 text-white"
              : "border-white bg-black/30 text-transparent"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}
