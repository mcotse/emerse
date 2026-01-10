"use client";

import { useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark" | "system";

export function useDarkMode() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  // Get system preference
  const getSystemPreference = useCallback(() => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  // Apply theme to document
  const applyTheme = useCallback(
    (theme: Theme) => {
      const root = document.documentElement;
      const isDark = theme === "dark" || (theme === "system" && getSystemPreference() === "dark");

      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    },
    [getSystemPreference]
  );

  // Initialize theme from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) {
      setTheme(stored);
      applyTheme(stored);
    } else {
      applyTheme("system");
    }
    setMounted(true);
  }, [applyTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme, applyTheme]);

  // Set theme and persist
  const setThemeAndPersist = useCallback(
    (newTheme: Theme) => {
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      applyTheme(newTheme);
    },
    [applyTheme]
  );

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const currentIsDark =
      theme === "dark" || (theme === "system" && getSystemPreference() === "dark");
    setThemeAndPersist(currentIsDark ? "light" : "dark");
  }, [theme, getSystemPreference, setThemeAndPersist]);

  // Get current effective theme
  const effectiveTheme =
    theme === "system" ? getSystemPreference() : theme;

  return {
    theme,
    effectiveTheme,
    setTheme: setThemeAndPersist,
    toggleTheme,
    mounted,
  };
}
