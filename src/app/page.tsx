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
  SAMPLE_TAGS,
} from "@/lib/clustering";
import { TagManager } from "@/components/TagManager";

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

  // Cluster photos based on selected mode
  const clusters = useMemo(() => {
    return clusterMode === "month" ? clusterByMonth(photos) : clusterByDay(photos);
  }, [photos, clusterMode]);

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
    >
      <div ref={containerRef} className="min-h-full">
        {hasPhotos ? (
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
        ) : (
          <div className="p-4">
            <EmptyState onUploadClick={() => setIsUploadOpen(true)} />
          </div>
        )}
      </div>

      {viewerState.isOpen && (
        <PhotoViewer
          photos={allPhotos}
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
