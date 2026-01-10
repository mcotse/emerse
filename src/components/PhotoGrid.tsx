"use client";

import Image from "next/image";
import { useState } from "react";

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
