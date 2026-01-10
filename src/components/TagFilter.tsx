"use client";

import { useMemo } from "react";
import type { Tag, PhotoWithDate } from "@/lib/clustering";

interface TagFilterProps {
  tags: Tag[];
  photos: PhotoWithDate[];
  selectedTags: string[];
  onSelectedTagsChange: (tagIds: string[]) => void;
}

export function TagFilter({
  tags,
  photos,
  selectedTags,
  onSelectedTagsChange,
}: TagFilterProps) {
  // Count photos per tag
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const photo of photos) {
      if (photo.tags) {
        for (const tag of photo.tags) {
          counts.set(tag.id, (counts.get(tag.id) || 0) + 1);
        }
      }
    }
    return counts;
  }, [photos]);

  // Sort tags by count (most used first)
  const sortedTags = useMemo(() => {
    return [...tags]
      .filter((tag) => tagCounts.get(tag.id))
      .sort((a, b) => (tagCounts.get(b.id) || 0) - (tagCounts.get(a.id) || 0));
  }, [tags, tagCounts]);

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onSelectedTagsChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onSelectedTagsChange([...selectedTags, tagId]);
    }
  };

  const clearAll = () => {
    onSelectedTagsChange([]);
  };

  if (sortedTags.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-black">
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
          Filter:
        </span>
        <div className="flex gap-1.5">
          {sortedTags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            const count = tagCounts.get(tag.id) || 0;

            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? "text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                style={isSelected ? { backgroundColor: tag.color || "#6b7280" } : undefined}
              >
                {tag.name}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    isSelected
                      ? "bg-white/20"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        {selectedTags.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
