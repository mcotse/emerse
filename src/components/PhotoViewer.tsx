"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, useRef } from "react";
import type { Photo } from "./PhotoGrid";
import type { PhotoMetadata, Tag } from "@/lib/clustering";
import { TagInput } from "./TagInput";

type PhotoWithMetadata = Photo & Partial<PhotoMetadata>;

interface PhotoViewerProps {
  photos: PhotoWithMetadata[];
  initialIndex: number;
  onClose: () => void;
  onTagsChange?: (photoId: string, tags: Tag[]) => void;
  availableTags?: Tag[];
}

interface ZoomState {
  scale: number;
  translateX: number;
  translateY: number;
}

export function PhotoViewer({
  photos,
  initialIndex,
  onClose,
  onTagsChange,
  availableTags,
}: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [zoom, setZoom] = useState<ZoomState>({ scale: 1, translateX: 0, translateY: 0 });
  const [lastTap, setLastTap] = useState<number>(0);
  const [pinchStart, setPinchStart] = useState<{ distance: number; scale: number } | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [shareState, setShareState] = useState<{
    isSharing: boolean;
    shareUrl?: string;
    error?: string;
  }>({ isSharing: false });
  const imageRef = useRef<HTMLDivElement>(null);

  const currentPhoto = photos[currentIndex];
  const hasNext = currentIndex < photos.length - 1;
  const hasPrev = currentIndex > 0;

  const resetZoom = useCallback(() => {
    setZoom({ scale: 1, translateX: 0, translateY: 0 });
  }, []);

  const goNext = useCallback(() => {
    if (hasNext) {
      setCurrentIndex((i) => i + 1);
      resetZoom();
    }
  }, [hasNext, resetZoom]);

  const goPrev = useCallback(() => {
    if (hasPrev) {
      setCurrentIndex((i) => i - 1);
      resetZoom();
    }
  }, [hasPrev, resetZoom]);

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Share current photo
  const handleShare = async () => {
    setShareState({ isSharing: true });

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoIds: [currentPhoto.id],
          expiresInDays: 30,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create share link");
      }

      const { shareUrl } = await response.json();
      setShareState({ isSharing: false, shareUrl });

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      setShareState({ isSharing: false, error: "Failed to create share link" });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowRight":
          goNext();
          break;
        case "ArrowLeft":
          goPrev();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goNext, goPrev]);

  // Touch handlers for swipe, pinch-to-zoom, and double-tap
  function handleTouchStart(e: React.TouchEvent) {
    // Handle pinch start (2 fingers)
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      setPinchStart({ distance, scale: zoom.scale });
      setTouchStart(null);
      return;
    }

    // Handle single touch (for swipe or double-tap)
    if (e.touches.length === 1) {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;

      // Check for double tap
      if (now - lastTap < DOUBLE_TAP_DELAY) {
        // Double tap detected - toggle zoom
        if (zoom.scale > 1) {
          resetZoom();
        } else {
          // Zoom to 2x centered on tap point
          const touch = e.touches[0];
          const rect = imageRef.current?.getBoundingClientRect();
          if (rect) {
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const offsetX = (centerX - touch.clientX) * 1; // scale from 1 to 2
            const offsetY = (centerY - touch.clientY) * 1;
            setZoom({ scale: 2, translateX: offsetX, translateY: offsetY });
          } else {
            setZoom({ scale: 2, translateX: 0, translateY: 0 });
          }
        }
        setLastTap(0);
        return;
      }

      setLastTap(now);
      setTouchStart(e.touches[0].clientX);
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    // Handle pinch zoom
    if (e.touches.length === 2 && pinchStart) {
      const distance = getTouchDistance(e.touches);
      const scaleFactor = distance / pinchStart.distance;
      const newScale = Math.min(Math.max(pinchStart.scale * scaleFactor, 1), 4);
      setZoom((prev) => ({ ...prev, scale: newScale }));
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    // Clear pinch state
    if (pinchStart) {
      setPinchStart(null);
      // Reset to 1x if zoomed out below threshold
      if (zoom.scale < 1.1) {
        resetZoom();
      }
      return;
    }

    // Handle swipe (only when not zoomed)
    if (touchStart === null || zoom.scale > 1) {
      setTouchStart(null);
      return;
    }

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    const threshold = 50;

    if (diff > threshold) {
      goNext();
    } else if (diff < -threshold) {
      goPrev();
    }

    setTouchStart(null);
  }

  // Prevent body scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const isZoomed = zoom.scale > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo viewer - ${currentIndex + 1} of ${photos.length}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header buttons */}
      <div className="absolute right-4 top-4 z-10 flex gap-2">
        <button
          type="button"
          onClick={handleShare}
          disabled={shareState.isSharing}
          className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70 disabled:opacity-50"
          aria-label="Share photo"
        >
          <ShareIcon className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className={`rounded-full p-2 text-white transition-colors ${
            showInfo ? "bg-white/30" : "bg-black/50 hover:bg-black/70"
          }`}
          aria-label="Photo info"
        >
          <InfoIcon className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          aria-label="Close"
        >
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Share confirmation toast */}
      {shareState.shareUrl && (
        <div
          role="status"
          aria-live="polite"
          className="absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow-lg"
        >
          Link copied to clipboard!
          <button
            type="button"
            onClick={() => setShareState({ isSharing: false })}
            className="ml-2 text-white/80 hover:text-white"
            aria-label="Dismiss notification"
          >
            Dismiss
          </button>
        </div>
      )}
      {shareState.error && (
        <div
          role="alert"
          aria-live="assertive"
          className="absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg"
        >
          {shareState.error}
          <button
            type="button"
            onClick={() => setShareState({ isSharing: false })}
            className="ml-2 text-white/80 hover:text-white"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation buttons - hide when zoomed */}
      {hasPrev && !isZoomed && (
        <button
          type="button"
          onClick={goPrev}
          className="absolute left-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          aria-label="Previous photo"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
      )}
      {hasNext && !isZoomed && (
        <button
          type="button"
          onClick={goNext}
          className="absolute right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          aria-label="Next photo"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      )}

      {/* Photo with zoom */}
      <div
        ref={imageRef}
        className="relative h-full w-full transition-transform duration-100"
        style={{
          transform: `scale(${zoom.scale}) translate(${zoom.translateX / zoom.scale}px, ${zoom.translateY / zoom.scale}px)`,
        }}
      >
        <Image
          src={currentPhoto.thumbnailUrl.replace("/400/400", "/1600/1600")}
          alt={currentPhoto.alt ?? "Photo"}
          fill
          className="object-contain"
          sizes="100vw"
          priority
          draggable={false}
        />
      </div>

      {/* Counter - hide when zoomed */}
      {!isZoomed && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
          {currentIndex + 1} / {photos.length}
        </div>
      )}

      {/* Zoom indicator */}
      {isZoomed && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
          {Math.round(zoom.scale * 100)}%
        </div>
      )}

      {/* Metadata panel */}
      <MetadataPanel
        photo={currentPhoto}
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        onTagsChange={onTagsChange}
        availableTags={availableTags}
      />
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 19.5 8.25 12l7.5-7.5"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8.25 4.5 7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
      />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
      />
    </svg>
  );
}

interface MetadataPanelProps {
  photo: PhotoWithMetadata;
  isOpen: boolean;
  onClose: () => void;
  onTagsChange?: (photoId: string, tags: Tag[]) => void;
  availableTags?: Tag[];
}

function MetadataPanel({ photo, isOpen, onClose, onTagsChange, availableTags }: MetadataPanelProps) {
  if (!isOpen) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <aside
      role="complementary"
      aria-label="Photo details"
      className="absolute bottom-0 right-0 top-0 w-80 overflow-y-auto bg-black/90 p-4 backdrop-blur-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 id="metadata-panel-title" className="text-lg font-semibold text-white">Details</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-white hover:bg-white/10"
          aria-label="Close panel"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Date taken */}
        {photo.takenAt && (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Date Taken
            </h3>
            <p className="mt-1 text-sm text-white">{formatDate(photo.takenAt)}</p>
          </div>
        )}

        {/* Dimensions */}
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Dimensions
          </h3>
          <p className="mt-1 text-sm text-white">
            {photo.width} × {photo.height}
          </p>
        </div>

        {/* File size */}
        {photo.fileSize && (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">
              File Size
            </h3>
            <p className="mt-1 text-sm text-white">{formatFileSize(photo.fileSize)}</p>
          </div>
        )}

        {/* Camera info */}
        {photo.camera && (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Camera
            </h3>
            <p className="mt-1 text-sm text-white">{photo.camera}</p>
            {photo.lens && <p className="text-sm text-gray-400">{photo.lens}</p>}
          </div>
        )}

        {/* Camera settings */}
        {(photo.aperture || photo.shutterSpeed || photo.iso || photo.focalLength) && (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Settings
            </h3>
            <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
              {photo.focalLength && (
                <div>
                  <span className="text-gray-400">Focal Length</span>
                  <p className="text-white">{photo.focalLength}</p>
                </div>
              )}
              {photo.aperture && (
                <div>
                  <span className="text-gray-400">Aperture</span>
                  <p className="text-white">{photo.aperture}</p>
                </div>
              )}
              {photo.shutterSpeed && (
                <div>
                  <span className="text-gray-400">Shutter</span>
                  <p className="text-white">{photo.shutterSpeed}</p>
                </div>
              )}
              {photo.iso && (
                <div>
                  <span className="text-gray-400">ISO</span>
                  <p className="text-white">{photo.iso}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Location */}
        {photo.location && (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Location
            </h3>
            <p className="mt-1 text-sm text-white">
              {photo.location.name || `${photo.location.latitude}, ${photo.location.longitude}`}
            </p>
          </div>
        )}

        {/* Tags */}
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
            Tags
          </h3>
          <TagInput
            tags={photo.tags || []}
            onTagsChange={(tags) => onTagsChange?.(photo.id, tags)}
            availableTags={availableTags}
          />
        </div>
      </div>
    </aside>
  );
}
