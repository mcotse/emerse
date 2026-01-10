"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface Album {
  id: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
}

interface AlbumManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPhotoIds?: string[];
  onAlbumCreated?: (albumId: string) => void;
}

export default function AlbumManager({
  isOpen,
  onClose,
  selectedPhotoIds = [],
  onAlbumCreated,
}: AlbumManagerProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumDescription, setNewAlbumDescription] = useState("");
  const [newAlbumPublic, setNewAlbumPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAlbums = useCallback(async () => {
    try {
      const response = await fetch("/api/albums");
      if (response.ok) {
        const data = await response.json();
        setAlbums(data.albums);
      }
    } catch {
      setError("Failed to load albums");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAlbums();
    }
  }, [isOpen, fetchAlbums]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAlbumName,
          description: newAlbumDescription || undefined,
          photoIds: selectedPhotoIds,
          isPublic: newAlbumPublic,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create album");
      }

      const album = await response.json();
      setAlbums((prev) => [
        {
          ...album,
          photoCount: selectedPhotoIds.length,
          isPublic: newAlbumPublic,
          updatedAt: album.createdAt,
        },
        ...prev,
      ]);
      setNewAlbumName("");
      setNewAlbumDescription("");
      setNewAlbumPublic(false);
      setShowCreateForm(false);
      setSuccessMessage(
        `Album "${album.name}" created${selectedPhotoIds.length > 0 ? ` with ${selectedPhotoIds.length} photos` : ""}`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
      onAlbumCreated?.(album.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create album");
    } finally {
      setCreating(false);
    }
  };

  const handleAddToAlbum = async (albumId: string) => {
    if (selectedPhotoIds.length === 0) return;

    try {
      const response = await fetch("/api/albums", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: albumId,
          action: "add",
          photoIds: selectedPhotoIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add photos to album");
      }

      const data = await response.json();
      setAlbums((prev) =>
        prev.map((album) =>
          album.id === albumId
            ? { ...album, photoCount: data.photoCount, updatedAt: data.updatedAt }
            : album
        )
      );
      setSuccessMessage(`Added ${selectedPhotoIds.length} photos to album`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add photos");
    }
  };

  const handleDeleteAlbum = async (albumId: string, albumName: string) => {
    if (!confirm(`Delete album "${albumName}"? Photos will not be deleted.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/albums?id=${albumId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete album");
      }

      setAlbums((prev) => prev.filter((album) => album.id !== albumId));
      setSuccessMessage(`Album "${albumName}" deleted`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete album");
    }
  };

  const getCoverUrl = (photoId?: string) => {
    if (!photoId) return null;
    return `https://picsum.photos/seed/${photoId.replace("photo-", "")}/200/200`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="album-manager-title"
    >
      <div className="relative mx-4 max-h-[80vh] w-full max-w-lg overflow-hidden rounded-xl bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <h2 id="album-manager-title" className="text-lg font-semibold text-white">
            {selectedPhotoIds.length > 0
              ? `Add ${selectedPhotoIds.length} photos to album`
              : "Albums"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-4 mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mx-4 mt-4 rounded-lg bg-green-500/20 px-4 py-2 text-sm text-green-400">
            {successMessage}
          </div>
        )}

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {/* Create new album button/form */}
          {showCreateForm ? (
            <form onSubmit={handleCreateAlbum} className="mb-4 rounded-lg bg-gray-800 p-4">
              <div className="mb-3">
                <label htmlFor="album-name" className="mb-1 block text-sm text-gray-400">
                  Album name
                </label>
                <input
                  id="album-name"
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="My Album"
                  maxLength={100}
                  className="w-full rounded-lg bg-gray-700 px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="mb-3">
                <label htmlFor="album-description" className="mb-1 block text-sm text-gray-400">
                  Description (optional)
                </label>
                <textarea
                  id="album-description"
                  value={newAlbumDescription}
                  onChange={(e) => setNewAlbumDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={2}
                  className="w-full resize-none rounded-lg bg-gray-700 px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input
                  id="album-public"
                  type="checkbox"
                  checked={newAlbumPublic}
                  onChange={(e) => setNewAlbumPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="album-public" className="text-sm text-gray-400">
                  Make album public
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newAlbumName.trim() || creating}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Album"}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mb-4 flex w-full items-center gap-3 rounded-lg bg-gray-800 p-4 text-left hover:bg-gray-750"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-700">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-white">Create new album</span>
            </button>
          )}

          {/* Album list */}
          {loading ? (
            <div className="py-8 text-center text-gray-400">Loading albums...</div>
          ) : albums.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              No albums yet. Create your first album!
            </div>
          ) : (
            <div className="space-y-2">
              {albums.map((album) => (
                <div
                  key={album.id}
                  className="group flex items-center gap-3 rounded-lg bg-gray-800 p-3"
                >
                  {/* Cover thumbnail */}
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-700">
                    {album.coverPhotoId ? (
                      <Image
                        src={getCoverUrl(album.coverPhotoId) || ""}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Album info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-medium text-white">{album.name}</h3>
                      {album.isPublic && (
                        <svg className="h-4 w-4 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {album.photoCount} photo{album.photoCount !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {selectedPhotoIds.length > 0 && (
                      <button
                        onClick={() => handleAddToAlbum(album.id)}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500"
                      >
                        Add
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAlbum(album.id, album.name)}
                      className="rounded-lg p-2 text-gray-500 opacity-0 hover:bg-gray-700 hover:text-red-400 group-hover:opacity-100"
                      aria-label={`Delete album ${album.name}`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
