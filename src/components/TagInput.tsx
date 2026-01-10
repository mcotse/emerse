"use client";

import { useState, useRef, useEffect } from "react";
import type { Tag } from "@/lib/clustering";
import { SAMPLE_TAGS, TAG_COLORS } from "@/lib/clustering";

interface TagInputProps {
  tags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  availableTags?: Tag[];
}

export function TagInput({
  tags,
  onTagsChange,
  availableTags = SAMPLE_TAGS,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  const suggestions = inputValue
    ? availableTags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
          !tags.some((t) => t.id === tag.id)
      )
    : availableTags.filter((tag) => !tags.some((t) => t.id === tag.id));

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tag: Tag) => {
    if (!tags.some((t) => t.id === tag.id)) {
      onTagsChange([...tags, tag]);
    }
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagId: string) => {
    onTagsChange(tags.filter((t) => t.id !== tagId));
  };

  const createNewTag = (name: string) => {
    const newTag: Tag = {
      id: `tag-new-${Date.now()}`,
      name: name.trim(),
      color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
    };
    addTag(newTag);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0 && showSuggestions) {
        addTag(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        createNewTag(inputValue);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1].id);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Current tags */}
      <div className="mb-2 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: tag.color || "#6b7280" }}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => removeTag(tag.id)}
              className="ml-0.5 rounded-full hover:bg-white/20"
              aria-label={`Remove ${tag.name} tag`}
            >
              <XIcon className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Add tags..."
          className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || inputValue.trim()) && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-600 bg-gray-800 py-1 shadow-lg">
          {suggestions.map((tag, index) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => addTag(tag)}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                index === selectedIndex ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: tag.color || "#6b7280" }}
              />
              <span className="text-white">{tag.name}</span>
            </button>
          ))}
          {inputValue.trim() &&
            !suggestions.some(
              (s) => s.name.toLowerCase() === inputValue.toLowerCase()
            ) && (
              <button
                type="button"
                onClick={() => createNewTag(inputValue)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                  suggestions.length === 0 ? "bg-gray-700" : "hover:bg-gray-700"
                }`}
              >
                <PlusIcon className="h-3 w-3 text-gray-400" />
                <span className="text-gray-300">
                  Create &quot;{inputValue.trim()}&quot;
                </span>
              </button>
            )}
        </div>
      )}
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
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

function PlusIcon({ className }: { className?: string }) {
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
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}
