import { useCallback, useEffect, useRef, useState } from "react";

interface PinchZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  zoomSensitivity?: number;
}

interface PinchZoomResult {
  zoom: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isPinching: boolean;
}

export function usePinchZoom({
  minZoom = 0.5,
  maxZoom = 2,
  initialZoom = 1,
  zoomSensitivity = 0.01,
}: PinchZoomOptions = {}): PinchZoomResult {
  const [zoom, setZoom] = useState(initialZoom);
  const [isPinching, setIsPinching] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialDistanceRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(initialZoom);

  const getDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault();
        setIsPinching(true);
        initialDistanceRef.current = getDistance(e.touches);
        initialZoomRef.current = zoom;
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length === 2 && initialDistanceRef.current !== null) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const scale = currentDistance / initialDistanceRef.current;
        const newZoom = initialZoomRef.current * scale;

        setZoom(Math.min(maxZoom, Math.max(minZoom, newZoom)));
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) {
        setIsPinching(false);
        initialDistanceRef.current = null;
      }
    }

    // Also support wheel zoom for desktop
    function handleWheel(e: WheelEvent) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * zoomSensitivity;
        setZoom((prev) => Math.min(maxZoom, Math.max(minZoom, prev + delta)));
      }
    }

    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("wheel", handleWheel);
    };
  }, [getDistance, maxZoom, minZoom, zoom, zoomSensitivity]);

  return { zoom, containerRef, isPinching };
}

// Helper to convert zoom level to column count
// Higher zoom = fewer columns (larger photos)
// Lower zoom = more columns (smaller photos)
export function zoomToColumns(
  zoom: number,
  columnOptions: number[] = [2, 3, 4, 6, 8]
): number {
  // Map zoom range [0.5, 2] to column options [8, 2] (inverse relationship)
  const index = Math.round((1 - (zoom - 0.5) / 1.5) * (columnOptions.length - 1));
  const clampedIndex = Math.max(0, Math.min(columnOptions.length - 1, index));
  return columnOptions[clampedIndex];
}
