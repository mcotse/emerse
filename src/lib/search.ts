import type { PhotoWithDate, Tag } from "./clustering";

export interface SearchResult {
  photo: PhotoWithDate;
  matches: SearchMatch[];
  score: number;
}

export interface SearchMatch {
  field: string;
  value: string;
  matchedTerm: string;
}

/**
 * Search photos by keywords across tags and metadata.
 * Returns photos sorted by relevance (most matches first).
 */
export function searchPhotos(
  photos: PhotoWithDate[],
  query: string
): SearchResult[] {
  if (!query.trim()) {
    return [];
  }

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  const results: SearchResult[] = [];

  for (const photo of photos) {
    const matches: SearchMatch[] = [];

    for (const term of terms) {
      // Search in tags
      if (photo.tags) {
        for (const tag of photo.tags) {
          if (tag.name.toLowerCase().includes(term)) {
            matches.push({
              field: "tag",
              value: tag.name,
              matchedTerm: term,
            });
          }
        }
      }

      // Search in camera
      if (photo.camera?.toLowerCase().includes(term)) {
        matches.push({
          field: "camera",
          value: photo.camera,
          matchedTerm: term,
        });
      }

      // Search in lens
      if (photo.lens?.toLowerCase().includes(term)) {
        matches.push({
          field: "lens",
          value: photo.lens,
          matchedTerm: term,
        });
      }

      // Search in location name
      if (photo.location?.name?.toLowerCase().includes(term)) {
        matches.push({
          field: "location",
          value: photo.location.name,
          matchedTerm: term,
        });
      }

      // Search in date (month names, year)
      if (photo.takenAt) {
        const dateStr = photo.takenAt.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }).toLowerCase();

        if (dateStr.includes(term)) {
          matches.push({
            field: "date",
            value: dateStr,
            matchedTerm: term,
          });
        }
      }

      // Search in aperture
      if (photo.aperture?.toLowerCase().includes(term)) {
        matches.push({
          field: "aperture",
          value: photo.aperture,
          matchedTerm: term,
        });
      }

      // Search in ISO
      if (photo.iso?.toString().includes(term)) {
        matches.push({
          field: "iso",
          value: `ISO ${photo.iso}`,
          matchedTerm: term,
        });
      }

      // Search in focal length
      if (photo.focalLength?.toLowerCase().includes(term)) {
        matches.push({
          field: "focalLength",
          value: photo.focalLength,
          matchedTerm: term,
        });
      }
    }

    if (matches.length > 0) {
      // Calculate score based on unique fields matched and total matches
      const uniqueFields = new Set(matches.map((m) => m.field)).size;
      const score = matches.length + uniqueFields * 2;

      results.push({
        photo,
        matches,
        score,
      });
    }
  }

  // Sort by score (highest first)
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Get search suggestions based on available tags and metadata.
 */
export function getSearchSuggestions(
  photos: PhotoWithDate[],
  tags: Tag[],
  query: string,
  limit: number = 5
): string[] {
  if (!query.trim()) {
    return [];
  }

  const term = query.toLowerCase().trim();
  const suggestions = new Set<string>();

  // Suggest matching tags
  for (const tag of tags) {
    if (tag.name.toLowerCase().includes(term)) {
      suggestions.add(tag.name);
    }
  }

  // Suggest matching cameras
  for (const photo of photos) {
    if (photo.camera?.toLowerCase().includes(term)) {
      suggestions.add(photo.camera);
    }
    if (photo.location?.name?.toLowerCase().includes(term)) {
      suggestions.add(photo.location.name);
    }
  }

  return Array.from(suggestions).slice(0, limit);
}
