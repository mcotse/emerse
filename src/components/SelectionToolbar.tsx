"use client";

import { usePhotoSelection } from "@/hooks/usePhotoSelection";

interface SelectionToolbarProps {
  totalCount: number;
  allPhotoIds: string[];
  onAddToAlbum?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
}

export function SelectionToolbar({
  totalCount,
  allPhotoIds,
  onAddToAlbum,
  onShare,
  onDelete,
  onDownload,
}: SelectionToolbarProps) {
  const {
    selectedCount,
    isSelectionMode,
    selectAll,
    deselectAll,
    exitSelectionMode,
  } = usePhotoSelection();

  if (!isSelectionMode) return null;

  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-black/95">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left: Selection info and controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exitSelectionMode}
            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Exit selection mode"
          >
            <CloseIcon className="h-5 w-5" />
          </button>

          <span className="font-medium">
            {selectedCount} selected
          </span>

          <button
            type="button"
            onClick={() => (allSelected ? deselectAll() : selectAll(allPhotoIds))}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {onAddToAlbum && (
            <button
              type="button"
              onClick={onAddToAlbum}
              disabled={selectedCount === 0}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
              aria-label="Add to album"
            >
              <AlbumIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Album</span>
            </button>
          )}

          {onShare && (
            <button
              type="button"
              onClick={onShare}
              disabled={selectedCount === 0}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
              aria-label="Share selected photos"
            >
              <ShareIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              disabled={selectedCount === 0}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
              aria-label="Download selected photos"
            >
              <DownloadIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={selectedCount === 0}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
              aria-label="Delete selected photos"
            >
              <TrashIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Floating button to enter selection mode
 */
interface SelectionModeButtonProps {
  onClick: () => void;
}

export function SelectionModeButton({ onClick }: SelectionModeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-black"
      aria-label="Select photos"
    >
      <CheckCircleIcon className="h-6 w-6" />
    </button>
  );
}

// Icons
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function AlbumIcon({ className }: { className?: string }) {
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
        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
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
      strokeWidth={1.5}
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

function DownloadIcon({ className }: { className?: string }) {
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
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
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
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}
