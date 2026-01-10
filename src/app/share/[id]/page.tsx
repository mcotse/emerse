"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";

// Gallery appearance settings (must match API types)
interface GallerySettings {
  theme: "dark" | "light" | "auto";
  layout: "grid" | "masonry" | "slideshow";
  columns: 2 | 3 | 4 | 6;
  showTitle: boolean;
  title?: string;
  showDescription: boolean;
  description?: string;
  showWatermark: boolean;
  allowDownload: boolean;
  accentColor?: string;
}

interface ShareData {
  photoIds: string[];
  createdAt: string;
  viewCount: number;
  settings: GallerySettings;
}

const DEFAULT_SETTINGS: GallerySettings = {
  theme: "dark",
  layout: "grid",
  columns: 3,
  showTitle: false,
  showDescription: false,
  showWatermark: true,
  allowDownload: false,
};

export default function SharePage() {
  const params = useParams();
  const shareId = params.id as string;

  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [slideshowIndex, setSlideshowIndex] = useState(0);

  // Detect system theme preference for "auto" setting
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

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
        setShareData({
          ...data,
          settings: { ...DEFAULT_SETTINGS, ...data.settings },
        });
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

  const settings = shareData?.settings || DEFAULT_SETTINGS;
  const effectiveTheme = settings.theme === "auto" ? systemTheme : settings.theme;
  const isDark = effectiveTheme === "dark";

  // Theme-based styles
  const themeStyles = useMemo(() => ({
    bg: isDark ? "bg-black" : "bg-white",
    bgSecondary: isDark ? "bg-gray-900" : "bg-gray-100",
    text: isDark ? "text-white" : "text-gray-900",
    textSecondary: isDark ? "text-gray-400" : "text-gray-600",
    border: isDark ? "border-gray-800" : "border-gray-200",
    headerBg: isDark ? "bg-black/80" : "bg-white/80",
  }), [isDark]);

  // Photos data
  const photos = useMemo(() =>
    shareData?.photoIds.map((id) => ({
      id,
      thumbnailUrl: `https://picsum.photos/seed/${id.replace("photo-", "")}/800/800`,
      fullUrl: `https://picsum.photos/seed/${id.replace("photo-", "")}/1600/1600`,
      alt: `Shared photo`,
    })) || [],
    [shareData?.photoIds]
  );

  // Slideshow navigation
  const nextSlide = () => setSlideshowIndex((i) => (i + 1) % photos.length);
  const prevSlide = () => setSlideshowIndex((i) => (i - 1 + photos.length) % photos.length);

  // Auto-advance slideshow
  useEffect(() => {
    if (settings.layout !== "slideshow" || photos.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [settings.layout, photos.length]);

  // Handle photo download
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${themeStyles.bg}`}>
        <div className="text-center">
          <div
            className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: settings.accentColor || (isDark ? "white" : "black") }}
          />
          <p className={`mt-4 text-sm ${themeStyles.textSecondary}`}>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${themeStyles.bg} p-4`}>
        <div className="text-center">
          <div className={`mb-4 rounded-full ${themeStyles.bgSecondary} p-4`}>
            <svg
              className={`mx-auto h-8 w-8 ${themeStyles.textSecondary}`}
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
          <h1 className={`text-lg font-semibold ${themeStyles.text}`}>{error}</h1>
          <p className={`mt-2 text-sm ${themeStyles.textSecondary}`}>
            The link may have expired or been removed.
          </p>
        </div>
      </div>
    );
  }

  // Get grid columns based on layout and settings
  const getGridColumns = () => {
    if (photos.length === 1) return "1fr";
    if (settings.layout === "masonry") {
      return `repeat(${settings.columns}, 1fr)`;
    }
    return `repeat(${settings.columns}, 1fr)`;
  };

  return (
    <div className={`min-h-screen ${themeStyles.bg}`}>
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b ${themeStyles.border} ${themeStyles.headerBg} backdrop-blur-sm`}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex flex-col">
            {settings.showTitle && settings.title ? (
              <h1
                className={`text-lg font-semibold ${themeStyles.text}`}
                style={{ color: settings.accentColor }}
              >
                {settings.title}
              </h1>
            ) : (
              <h1 className={`text-lg font-semibold ${themeStyles.text}`}>Emerse</h1>
            )}
            {settings.showDescription && settings.description && (
              <p className={`text-xs ${themeStyles.textSecondary}`}>
                {settings.description}
              </p>
            )}
          </div>
          <span className={`text-xs ${themeStyles.textSecondary}`}>
            {shareData?.viewCount} view{shareData?.viewCount !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {/* Content based on layout */}
      <main className="p-1">
        {settings.layout === "slideshow" && photos.length > 0 ? (
          /* Slideshow Layout */
          <div className="relative flex h-[calc(100vh-8rem)] items-center justify-center">
            <div className="relative h-full w-full">
              <Image
                src={photos[slideshowIndex].fullUrl}
                alt={photos[slideshowIndex].alt}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {/* Navigation arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 rounded-full ${themeStyles.bgSecondary} p-3 opacity-70 transition hover:opacity-100`}
                  aria-label="Previous photo"
                >
                  <svg className={`h-6 w-6 ${themeStyles.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextSlide}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 rounded-full ${themeStyles.bgSecondary} p-3 opacity-70 transition hover:opacity-100`}
                  aria-label="Next photo"
                >
                  <svg className={`h-6 w-6 ${themeStyles.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Slide indicators */}
            {photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSlideshowIndex(index)}
                    className={`h-2 w-2 rounded-full transition ${
                      index === slideshowIndex
                        ? "bg-white"
                        : "bg-white/40 hover:bg-white/60"
                    }`}
                    style={index === slideshowIndex && settings.accentColor ? { backgroundColor: settings.accentColor } : undefined}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Download button for slideshow */}
            {settings.allowDownload && (
              <button
                onClick={() => handleDownload(photos[slideshowIndex].fullUrl, `photo-${slideshowIndex + 1}.jpg`)}
                className={`absolute right-4 top-4 rounded-full ${themeStyles.bgSecondary} p-2 opacity-70 transition hover:opacity-100`}
                aria-label="Download photo"
              >
                <svg className={`h-5 w-5 ${themeStyles.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            )}
          </div>
        ) : settings.layout === "masonry" ? (
          /* Masonry Layout */
          <div
            className="columns-2 gap-1 md:columns-3 lg:columns-4"
            style={{ columnCount: settings.columns }}
          >
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={`relative mb-1 overflow-hidden ${themeStyles.bgSecondary} group`}
              >
                <Image
                  src={photo.thumbnailUrl}
                  alt={photo.alt}
                  width={800}
                  height={800}
                  className="w-full object-cover"
                  sizes={`(max-width: 768px) 50vw, ${100 / settings.columns}vw`}
                />
                {settings.allowDownload && (
                  <button
                    onClick={() => handleDownload(photo.fullUrl, `${photo.id}.jpg`)}
                    className={`absolute bottom-2 right-2 rounded-full ${themeStyles.bgSecondary} p-2 opacity-0 transition group-hover:opacity-100`}
                    aria-label="Download photo"
                  >
                    <svg className={`h-4 w-4 ${themeStyles.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Grid Layout (default) */
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: getGridColumns(),
            }}
          >
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={`relative ${
                  photos.length === 1 ? "aspect-auto max-h-[80vh]" : "aspect-square"
                } overflow-hidden ${themeStyles.bgSecondary} group`}
              >
                <Image
                  src={photo.thumbnailUrl}
                  alt={photo.alt}
                  fill={photos.length > 1}
                  width={photos.length === 1 ? 1200 : undefined}
                  height={photos.length === 1 ? 1200 : undefined}
                  className={photos.length === 1 ? "w-full object-contain" : "object-cover"}
                  sizes={photos.length === 1 ? "100vw" : `(max-width: 768px) 50vw, ${100 / settings.columns}vw`}
                />
                {settings.allowDownload && (
                  <button
                    onClick={() => handleDownload(photo.fullUrl, `${photo.id}.jpg`)}
                    className={`absolute bottom-2 right-2 rounded-full ${themeStyles.bgSecondary} p-2 opacity-0 transition group-hover:opacity-100`}
                    aria-label="Download photo"
                  >
                    <svg className={`h-4 w-4 ${themeStyles.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t ${themeStyles.border} p-4 text-center text-xs ${themeStyles.textSecondary}`}>
        {settings.showWatermark ? (
          <span>
            Shared via{" "}
            <span style={{ color: settings.accentColor }}>Emerse</span>
          </span>
        ) : (
          <span>&nbsp;</span>
        )}
      </footer>
    </div>
  );
}
