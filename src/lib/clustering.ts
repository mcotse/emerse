import { Photo } from "@/components/PhotoGrid";

export interface PhotoMetadata {
  takenAt?: Date;
  camera?: string;
  lens?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  focalLength?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  fileSize?: number;
}

export interface PhotoWithDate extends Photo, PhotoMetadata {}

export interface PhotoCluster {
  id: string;
  label: string;
  sublabel?: string;
  photos: PhotoWithDate[];
}

/**
 * Group photos by month and year.
 * Photos without dates are grouped into "Undated".
 */
export function clusterByMonth(photos: PhotoWithDate[]): PhotoCluster[] {
  const clusters = new Map<string, PhotoWithDate[]>();

  for (const photo of photos) {
    const key = photo.takenAt
      ? `${photo.takenAt.getFullYear()}-${String(photo.takenAt.getMonth() + 1).padStart(2, "0")}`
      : "undated";

    if (!clusters.has(key)) {
      clusters.set(key, []);
    }
    clusters.get(key)!.push(photo);
  }

  // Sort clusters by date (newest first), with undated at the end
  const sortedKeys = Array.from(clusters.keys()).sort((a, b) => {
    if (a === "undated") return 1;
    if (b === "undated") return -1;
    return b.localeCompare(a);
  });

  return sortedKeys.map((key) => {
    const photos = clusters.get(key)!;
    if (key === "undated") {
      return {
        id: key,
        label: "Undated",
        photos,
      };
    }

    const [year, month] = key.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    return {
      id: key,
      label,
      photos,
    };
  });
}

/**
 * Group photos by day.
 * Useful for more detailed timeline views.
 */
export function clusterByDay(photos: PhotoWithDate[]): PhotoCluster[] {
  const clusters = new Map<string, PhotoWithDate[]>();

  for (const photo of photos) {
    const key = photo.takenAt
      ? `${photo.takenAt.getFullYear()}-${String(photo.takenAt.getMonth() + 1).padStart(2, "0")}-${String(photo.takenAt.getDate()).padStart(2, "0")}`
      : "undated";

    if (!clusters.has(key)) {
      clusters.set(key, []);
    }
    clusters.get(key)!.push(photo);
  }

  // Sort clusters by date (newest first)
  const sortedKeys = Array.from(clusters.keys()).sort((a, b) => {
    if (a === "undated") return 1;
    if (b === "undated") return -1;
    return b.localeCompare(a);
  });

  return sortedKeys.map((key) => {
    const photos = clusters.get(key)!;
    if (key === "undated") {
      return {
        id: key,
        label: "Undated",
        photos,
      };
    }

    const [year, month, day] = key.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    // Check if it's today, yesterday, or another day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const photoDate = new Date(date);
    photoDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - photoDate.getTime()) / (1000 * 60 * 60 * 24));

    let label: string;
    let sublabel: string | undefined;

    if (diffDays === 0) {
      label = "Today";
      sublabel = date.toLocaleDateString("en-US", { weekday: "long" });
    } else if (diffDays === 1) {
      label = "Yesterday";
      sublabel = date.toLocaleDateString("en-US", { weekday: "long" });
    } else if (diffDays < 7) {
      label = date.toLocaleDateString("en-US", { weekday: "long" });
      sublabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      label = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      sublabel = date.getFullYear().toString();
    }

    return {
      id: key,
      label,
      sublabel,
      photos,
    };
  });
}

/**
 * Generate a simple blur placeholder data URL.
 * Uses a small SVG with a gradient to simulate a blurred image.
 */
function generateBlurPlaceholder(seed: number): string {
  // Generate pseudo-random colors based on seed
  const hue1 = (seed * 137) % 360;
  const hue2 = (seed * 73 + 180) % 360;

  // Create a simple SVG gradient that simulates a blurred photo
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue1},40%,60%)" />
          <stop offset="100%" style="stop-color:hsl(${hue2},40%,50%)" />
        </linearGradient>
      </defs>
      <rect fill="url(#g)" width="8" height="8"/>
    </svg>
  `.trim().replace(/\s+/g, " ");

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Mock camera/lens data for generating realistic metadata
const CAMERAS = [
  "Canon EOS R5",
  "Sony A7 IV",
  "Nikon Z6 II",
  "Fujifilm X-T5",
  "iPhone 15 Pro",
];
const LENSES = [
  "24-70mm f/2.8",
  "70-200mm f/2.8",
  "50mm f/1.4",
  "35mm f/1.8",
  "85mm f/1.2",
];
const APERTURES = ["f/1.4", "f/1.8", "f/2.8", "f/4", "f/5.6", "f/8", "f/11"];
const SHUTTER_SPEEDS = ["1/2000", "1/1000", "1/500", "1/250", "1/125", "1/60"];
const ISOS = [100, 200, 400, 800, 1600, 3200];
const FOCAL_LENGTHS = ["24mm", "35mm", "50mm", "85mm", "135mm", "200mm"];

/**
 * Generate mock photos with dates and metadata for testing.
 */
export function generateMockPhotosWithDates(count: number): PhotoWithDate[] {
  const photos: PhotoWithDate[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    // Distribute photos across the last 12 months
    const daysAgo = Math.floor(Math.random() * 365);
    const takenAt = new Date(now);
    takenAt.setDate(takenAt.getDate() - daysAgo);

    // Generate random metadata
    const hasMetadata = Math.random() > 0.2; // 80% have metadata

    photos.push({
      id: `photo-${i}`,
      thumbnailUrl: `https://picsum.photos/seed/${i}/400/400`,
      width: 3000 + Math.floor(Math.random() * 3000),
      height: 2000 + Math.floor(Math.random() * 2000),
      alt: `Photo ${i + 1}`,
      blurDataURL: generateBlurPlaceholder(i),
      takenAt,
      ...(hasMetadata && {
        camera: CAMERAS[Math.floor(Math.random() * CAMERAS.length)],
        lens: LENSES[Math.floor(Math.random() * LENSES.length)],
        aperture: APERTURES[Math.floor(Math.random() * APERTURES.length)],
        shutterSpeed: SHUTTER_SPEEDS[Math.floor(Math.random() * SHUTTER_SPEEDS.length)],
        iso: ISOS[Math.floor(Math.random() * ISOS.length)],
        focalLength: FOCAL_LENGTHS[Math.floor(Math.random() * FOCAL_LENGTHS.length)],
        fileSize: Math.floor(Math.random() * 20000000) + 1000000, // 1-21 MB
      }),
    });
  }

  // Sort by date (newest first)
  return photos.sort((a, b) => {
    if (!a.takenAt) return 1;
    if (!b.takenAt) return -1;
    return b.takenAt.getTime() - a.takenAt.getTime();
  });
}
