"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";

interface ShareData {
  photoIds: string[];
  createdAt: string;
  viewCount: number;
}

export default function SharePage() {
  const params = useParams();
  const shareId = params.id as string;

  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShare() {
      try {
        const response = await fetch(`/api/share?id=${shareId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("This share link doesn't exist.");
          } else if (response.status === 410) {
            setError("This share link has expired.");
          } else {
            setError("Failed to load shared content.");
          }
          return;
        }

        const data = await response.json();
        setShareData(data);
      } catch {
        setError("Failed to load shared content.");
      } finally {
        setLoading(false);
      }
    }

    if (shareId) {
      fetchShare();
    }
  }, [shareId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <p className="mt-4 text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-4">
        <div className="text-center">
          <div className="mb-4 rounded-full bg-gray-800 p-4">
            <svg
              className="mx-auto h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-white">{error}</h1>
          <p className="mt-2 text-sm text-gray-400">
            The link may have expired or been removed.
          </p>
        </div>
      </div>
    );
  }

  // For mock data, generate placeholder images
  const photos = shareData?.photoIds.map((id) => ({
    id,
    thumbnailUrl: `https://picsum.photos/seed/${id.replace("photo-", "")}/800/800`,
    alt: `Shared photo`,
  })) || [];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-black/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-semibold text-white">Emerse</h1>
          <span className="text-xs text-gray-400">
            {shareData?.viewCount} view{shareData?.viewCount !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {/* Photo grid */}
      <main className="p-1">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: photos.length === 1 ? "1fr" : "repeat(auto-fill, minmax(200px, 1fr))",
          }}
        >
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`relative ${
                photos.length === 1 ? "aspect-auto max-h-[80vh]" : "aspect-square"
              } overflow-hidden bg-gray-900`}
            >
              <Image
                src={photo.thumbnailUrl}
                alt={photo.alt}
                fill={photos.length > 1}
                width={photos.length === 1 ? 1200 : undefined}
                height={photos.length === 1 ? 1200 : undefined}
                className={photos.length === 1 ? "w-full object-contain" : "object-cover"}
                sizes={photos.length === 1 ? "100vw" : "(max-width: 768px) 50vw, 25vw"}
              />
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 p-4 text-center text-xs text-gray-500">
        Shared via Emerse
      </footer>
    </div>
  );
}
