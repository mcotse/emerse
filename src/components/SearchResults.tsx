"use client";

import Image from "next/image";
import { useState } from "react";
import type { SearchResult } from "@/lib/search";
import type { PhotoWithDate } from "@/lib/clustering";

interface SearchResultsProps {
  results: SearchResult[];
  columns?: number;
  onPhotoClick?: (photo: PhotoWithDate, index: number) => void;
}

export function SearchResults({
  results,
  columns = 3,
  onPhotoClick,
}: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-900">
          <SearchIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="mb-2 text-lg font-medium">No results found</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Try different keywords or check your spelling
        </p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {results.map((result, index) => (
          <SearchResultCard
            key={result.photo.id}
            result={result}
            onClick={() => onPhotoClick?.(result.photo, index)}
          />
        ))}
      </div>
    </div>
  );
}

interface SearchResultCardProps {
  result: SearchResult;
  onClick?: () => void;
}

function SearchResultCard({ result, onClick }: SearchResultCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { photo, matches } = result;
  const hasBlur = Boolean(photo.blurDataURL);

  // Group matches by field for display
  const uniqueMatches = matches.reduce(
    (acc, match) => {
      if (!acc.some((m) => m.field === match.field && m.value === match.value)) {
        acc.push(match);
      }
      return acc;
    },
    [] as typeof matches
  );

  // Get display label for match field
  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      tag: "Tag",
      camera: "Camera",
      lens: "Lens",
      location: "Location",
      date: "Date",
      aperture: "Aperture",
      iso: "ISO",
      focalLength: "Focal",
    };
    return labels[field] || field;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-lg bg-gray-100 text-left transition-all hover:ring-2 hover:ring-black focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-900 dark:hover:ring-white dark:focus:ring-white"
    >
      {/* Photo thumbnail */}
      <div className="aspect-square overflow-hidden">
        {!isLoaded && !hasBlur && (
          <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-800" />
        )}
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
      </div>

      {/* Match info overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2 pt-8">
        <div className="flex flex-wrap gap-1">
          {uniqueMatches.slice(0, 3).map((match, i) => (
            <span
              key={`${match.field}-${match.value}-${i}`}
              className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
            >
              <span className="mr-1 opacity-70">{getFieldLabel(match.field)}:</span>
              <span className="truncate max-w-[80px]">{match.value}</span>
            </span>
          ))}
          {uniqueMatches.length > 3 && (
            <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              +{uniqueMatches.length - 3}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}
