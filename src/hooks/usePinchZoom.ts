import { useCallback, useEffect, useRef, useState } from "react";

interface PinchZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  zoomSensitivity?: number;
  enableMomentum?: boolean;
  friction?: number;
}

interface PinchZoomResult {
  zoom: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isPinching: boolean;
  zoomVelocity: number;
}

export function usePinchZoom({
  minZoom = 0.5,
  maxZoom = 2,
  initialZoom = 1,
  zoomSensitivity = 0.01,
  enableMomentum = true,
  friction = 0.92,
}: PinchZoomOptions = {}): PinchZoomResult {
  const [zoom, setZoom] = useState(initialZoom);
  const [isPinching, setIsPinching] = useState(false);
  const [zoomVelocity, setZoomVelocity] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialDistanceRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(initialZoom);
  const lastZoomRef = useRef<number>(initialZoom);
  const lastTimeRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);

  const getDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Momentum animation
  const animateMomentum = useCallback(() => {
    if (Math.abs(velocityRef.current) < 0.001) {
      setZoomVelocity(0);
      animationRef.current = null;
      return;
    }

    velocityRef.current *= friction;
    setZoomVelocity(velocityRef.current);

    setZoom((prev) => {
      const newZoom = prev + velocityRef.current;
      return Math.min(maxZoom, Math.max(minZoom, newZoom));
    });

    animationRef.current = requestAnimationFrame(animateMomentum);
  }, [friction, maxZoom, minZoom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault();
        setIsPinching(true);
        initialDistanceRef.current = getDistance(e.touches);
        initialZoomRef.current = zoom;
        lastZoomRef.current = zoom;
        lastTimeRef.current = performance.now();
        velocityRef.current = 0;

        // Cancel any ongoing momentum animation
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length === 2 && initialDistanceRef.current !== null) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const scale = currentDistance / initialDistanceRef.current;
        const newZoom = Math.min(maxZoom, Math.max(minZoom, initialZoomRef.current * scale));

        // Calculate velocity
        const now = performance.now();
        const dt = now - lastTimeRef.current;
        if (dt > 0) {
          velocityRef.current = (newZoom - lastZoomRef.current) / dt * 16; // Normalize to ~60fps
        }
        lastZoomRef.current = newZoom;
        lastTimeRef.current = now;

        setZoom(newZoom);
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) {
        setIsPinching(false);
        initialDistanceRef.current = null;

        // Start momentum animation if enabled and velocity is significant
        if (enableMomentum && Math.abs(velocityRef.current) > 0.005) {
          animationRef.current = requestAnimationFrame(animateMomentum);
        }
      }
    }

    // Also support wheel zoom for desktop with momentum
    function handleWheel(e: WheelEvent) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * zoomSensitivity;

        // Cancel any ongoing animation and add to velocity
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
        }

        velocityRef.current = delta * 0.5;
        setZoom((prev) => Math.min(maxZoom, Math.max(minZoom, prev + delta)));

        // Start momentum
        if (enableMomentum) {
          animationRef.current = requestAnimationFrame(animateMomentum);
        }
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

      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animateMomentum, enableMomentum, getDistance, maxZoom, minZoom, zoom, zoomSensitivity]);

  return { zoom, containerRef, isPinching, zoomVelocity };
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
