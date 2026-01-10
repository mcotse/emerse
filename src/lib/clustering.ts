import { Photo } from "@/components/PhotoGrid";

export interface PhotoWithDate extends Photo {
  takenAt?: Date;
}

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
 * Generate mock photos with dates for testing clustering.
 */
export function generateMockPhotosWithDates(count: number): PhotoWithDate[] {
  const photos: PhotoWithDate[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    // Distribute photos across the last 12 months
    const daysAgo = Math.floor(Math.random() * 365);
    const takenAt = new Date(now);
    takenAt.setDate(takenAt.getDate() - daysAgo);

    photos.push({
      id: `photo-${i}`,
      thumbnailUrl: `https://picsum.photos/seed/${i}/400/400`,
      width: 400,
      height: 400,
      alt: `Photo ${i + 1}`,
      takenAt,
    });
  }

  // Sort by date (newest first)
  return photos.sort((a, b) => {
    if (!a.takenAt) return 1;
    if (!b.takenAt) return -1;
    return b.takenAt.getTime() - a.takenAt.getTime();
  });
}
