"use client";

import { useState, useEffect } from "react";

interface ResponsiveColumnsConfig {
  /** Columns for mobile (< 640px) */
  mobile?: number;
  /** Columns for tablet (640px - 1023px) */
  tablet?: number;
  /** Columns for desktop (1024px - 1279px) */
  desktop?: number;
  /** Columns for large desktop (>= 1280px) */
  large?: number;
}

const DEFAULT_CONFIG: Required<ResponsiveColumnsConfig> = {
  mobile: 2,
  tablet: 3,
  desktop: 4,
  large: 6,
};

/**
 * Hook that returns responsive column count based on screen width.
 * Updates on window resize with debouncing for performance.
 */
export function useResponsiveColumns(
  config: ResponsiveColumnsConfig = {}
): number {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const [columns, setColumns] = useState<number>(() => {
    // SSR fallback
    if (typeof window === "undefined") return mergedConfig.desktop;
    return getColumnsForWidth(window.innerWidth, mergedConfig);
  });

  useEffect(() => {
    const handleResize = () => {
      setColumns(getColumnsForWidth(window.innerWidth, mergedConfig));
    };

    // Set initial value
    handleResize();

    // Debounced resize handler
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [mergedConfig.mobile, mergedConfig.tablet, mergedConfig.desktop, mergedConfig.large]);

  return columns;
}

function getColumnsForWidth(
  width: number,
  config: Required<ResponsiveColumnsConfig>
): number {
  if (width < 640) return config.mobile;
  if (width < 1024) return config.tablet;
  if (width < 1280) return config.desktop;
  return config.large;
}

/**
 * Returns the current breakpoint name
 */
export function useBreakpoint(): "mobile" | "tablet" | "desktop" | "large" {
  const [breakpoint, setBreakpoint] = useState<"mobile" | "tablet" | "desktop" | "large">(() => {
    if (typeof window === "undefined") return "desktop";
    return getBreakpointForWidth(window.innerWidth);
  });

  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getBreakpointForWidth(window.innerWidth));
    };

    handleResize();

    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return breakpoint;
}

function getBreakpointForWidth(width: number): "mobile" | "tablet" | "desktop" | "large" {
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  if (width < 1280) return "desktop";
  return "large";
}

/**
 * Check if current viewport is mobile
 */
export function useIsMobile(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === "mobile";
}
