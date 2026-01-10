"use client";

import { useState, useMemo, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { ClusteredPhotoGrid } from "@/components/PhotoGrid";
import { PhotoViewer } from "@/components/PhotoViewer";
import { UploadModal } from "@/components/UploadModal";
import { usePinchZoom, zoomToColumns } from "@/hooks/usePinchZoom";
import type { PhotoWithDate, Tag } from "@/lib/clustering";
import {
  generateMockPhotosWithDates,
  clusterByMonth,
  clusterByDay,
  filterByTags,
  SAMPLE_TAGS,
} from "@/lib/clustering";
import { TagManager } from "@/components/TagManager";
import { TagFilter } from "@/components/TagFilter";
import { SearchResults } from "@/components/SearchResults";
import { searchPhotos, type SearchResult } from "@/lib/search";

export type ClusterMode = "month" | "day";

// Initial mock photos for development - will be replaced with real data
// Using 500 photos distributed across the last year to test clustering
const INITIAL_PHOTOS = generateMockPhotosWithDates(500);

const COLUMN_OPTIONS = [2, 3, 4, 6, 8];

export default function Home() {
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    index: number;
  }>({ isOpen: false, index: 0 });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [clusterMode, setClusterMode] = useState<ClusterMode>("month");
  const [photos, setPhotos] = useState<PhotoWithDate[]>(INITIAL_PHOTOS);
  const [availableTags, setAvailableTags] = useState<Tag[]>(SAMPLE_TAGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);

  const { zoom, containerRef, isPinching } = usePinchZoom({
    minZoom: 0.5,
    maxZoom: 2,
    initialZoom: 1,
  });

  const columns = zoomToColumns(zoom, COLUMN_OPTIONS);

  const hasPhotos = photos.length > 0;

  // Handle tag changes for a photo
  const handleTagsChange = useCallback((photoId: string, newTags: Tag[]) => {
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId ? { ...photo, tags: newTags } : photo
      )
    );
  }, []);

  // Handle global tag list changes (from tag manager)
  const handleAvailableTagsChange = useCallback(
    (newTags: Tag[]) => {
      // Find deleted tags
      const deletedTagIds = availableTags
        .filter((t) => !newTags.some((nt) => nt.id === t.id))
        .map((t) => t.id);

      // Remove deleted tags from photos
      if (deletedTagIds.length > 0) {
        setPhotos((prev) =>
          prev.map((photo) => ({
            ...photo,
            tags: photo.tags?.filter((t) => !deletedTagIds.includes(t.id)),
          }))
        );
      }

      // Update any existing tags on photos with new data (e.g., name/color changes)
      setPhotos((prev) =>
        prev.map((photo) => ({
          ...photo,
          tags: photo.tags?.map(
            (pt) => newTags.find((nt) => nt.id === pt.id) || pt
          ),
        }))
      );

      setAvailableTags(newTags);
    },
    [availableTags]
  );

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (query.trim()) {
        const results = searchPhotos(photos, query);
        setSearchResults(results);
      } else {
        setSearchResults(null);
      }
    },
    [photos]
  );

  // Filter photos by selected tags
  const filteredPhotos = useMemo(() => {
    return filterByTags(photos, selectedTagFilters);
  }, [photos, selectedTagFilters]);

  const hasFilteredPhotos = filteredPhotos.length > 0;

  // Cluster photos based on selected mode
  const clusters = useMemo(() => {
    return clusterMode === "month" ? clusterByMonth(filteredPhotos) : clusterByDay(filteredPhotos);
  }, [filteredPhotos, clusterMode]);

  // Flatten clusters for photo viewer navigation
  const allPhotos = useMemo(
    () => clusters.flatMap((c) => c.photos),
    [clusters]
  );

  function openViewer(index: number) {
    setViewerState({ isOpen: true, index });
  }

  function closeViewer() {
    setViewerState({ isOpen: false, index: 0 });
  }

  return (
    <AppShell
      onUploadClick={() => setIsUploadOpen(true)}
      onTagsClick={() => setIsTagManagerOpen(true)}
      clusterMode={clusterMode}
      onClusterModeChange={setClusterMode}
      photos={photos}
      tags={availableTags}
      onSearch={handleSearch}
    >
      <div ref={containerRef} className="min-h-full">
        {/* Tag filter bar */}
        {!searchResults && (
          <TagFilter
            tags={availableTags}
            photos={photos}
            selectedTags={selectedTagFilters}
            onSelectedTagsChange={setSelectedTagFilters}
          />
        )}

        {/* Search results indicator */}
        {searchQuery && searchResults && (
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
              </span>
              <button
                type="button"
                onClick={() => handleSearch("")}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Clear search
              </button>
            </div>
          </div>
        )}
        {searchResults ? (
          <SearchResults
            results={searchResults}
            columns={columns}
            onPhotoClick={(photo, index) => {
              setViewerState({ isOpen: true, index });
            }}
          />
        ) : hasFilteredPhotos ? (
          <>
            <ClusteredPhotoGrid
              clusters={clusters}
              columns={columns}
              onPhotoClick={(_, index) => openViewer(index)}
            />
            {isPinching && (
              <div className="pointer-events-none fixed bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white">
                {columns} columns
              </div>
            )}
          </>
        ) : hasPhotos && selectedTagFilters.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-900">
              <FilterIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="mb-2 text-lg font-medium">No photos match the filter</h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Try selecting different tags or clear the filter
            </p>
            <button
              type="button"
              onClick={() => setSelectedTagFilters([])}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Clear Filter
            </button>
          </div>
        ) : (
          <div className="p-4">
            <EmptyState onUploadClick={() => setIsUploadOpen(true)} />
          </div>
        )}
      </div>

      {viewerState.isOpen && (
        <PhotoViewer
          photos={searchResults ? searchResults.map((r) => r.photo) : allPhotos}
          initialIndex={viewerState.index}
          onClose={closeViewer}
          onTagsChange={handleTagsChange}
          availableTags={availableTags}
        />
      )}

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={() => {
          // TODO: Refresh photo list
          console.log("Upload complete");
        }}
      />

      <TagManager
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        tags={availableTags}
        onTagsChange={handleAvailableTagsChange}
      />
    </AppShell>
  );
}

interface EmptyStateProps {
  onUploadClick?: () => void;
}

function EmptyState({ onUploadClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-900">
        <PhotoIcon className="h-8 w-8 text-gray-400" />
      </div>
      <h2 className="mb-2 text-lg font-medium">No photos yet</h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Upload your first photo to get started
      </p>
      <button
        type="button"
        onClick={onUploadClick}
        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
      >
        Upload Photos
      </button>
    </div>
  );
}

function PhotoIcon({ className }: { className?: string }) {
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
        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
      />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
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
        d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
      />
    </svg>
  );
}
