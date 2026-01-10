"use client";

import { useCallback, useRef, useState } from "react";

interface VelocityPoint {
  x: number;
  y: number;
  time: number;
}

interface MomentumOptions {
  friction?: number; // 0-1, higher = more friction (slower decay)
  minVelocity?: number; // Minimum velocity threshold to trigger momentum
  maxVelocity?: number; // Cap velocity for consistent feel
}

interface MomentumState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  isAnimating: boolean;
}

interface MomentumResult {
  state: MomentumState;
  startTracking: (x: number, y: number) => void;
  updateTracking: (x: number, y: number) => void;
  endTracking: () => { velocityX: number; velocityY: number };
  startMomentum: (velocityX: number, velocityY: number, onUpdate: (x: number, y: number) => void) => void;
  stopMomentum: () => void;
}

const DEFAULT_OPTIONS: Required<MomentumOptions> = {
  friction: 0.92, // Natural deceleration
  minVelocity: 0.5,
  maxVelocity: 50,
};

/**
 * Hook for gesture momentum/inertia on release
 * Tracks velocity during gesture and continues animation after release
 */
export function useGestureMomentum(options: MomentumOptions = {}): MomentumResult {
  const config = { ...DEFAULT_OPTIONS, ...options };

  const [state, setState] = useState<MomentumState>({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    isAnimating: false,
  });

  const velocityHistoryRef = useRef<VelocityPoint[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);

  /**
   * Start tracking a gesture
   */
  const startTracking = useCallback((x: number, y: number) => {
    // Cancel any ongoing animation
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Reset tracking state
    velocityHistoryRef.current = [];
    lastPositionRef.current = { x, y };

    setState((prev) => ({
      ...prev,
      x,
      y,
      velocityX: 0,
      velocityY: 0,
      isAnimating: false,
    }));
  }, []);

  /**
   * Update tracking during gesture
   */
  const updateTracking = useCallback((x: number, y: number) => {
    const now = performance.now();
    const lastPos = lastPositionRef.current;

    if (lastPos) {
      // Add point to velocity history
      velocityHistoryRef.current.push({
        x: x - lastPos.x,
        y: y - lastPos.y,
        time: now,
      });

      // Keep only recent points (last 100ms)
      const cutoff = now - 100;
      velocityHistoryRef.current = velocityHistoryRef.current.filter(
        (p) => p.time > cutoff
      );
    }

    lastPositionRef.current = { x, y };

    setState((prev) => ({
      ...prev,
      x,
      y,
    }));
  }, []);

  /**
   * Calculate velocity from recent tracking points
   */
  const calculateVelocity = useCallback((): { velocityX: number; velocityY: number } => {
    const history = velocityHistoryRef.current;

    if (history.length < 2) {
      return { velocityX: 0, velocityY: 0 };
    }

    // Calculate weighted average velocity (more recent points have more weight)
    let totalX = 0;
    let totalY = 0;
    let totalWeight = 0;

    for (let i = 0; i < history.length; i++) {
      const weight = i + 1; // Newer points get higher weight
      totalX += history[i].x * weight;
      totalY += history[i].y * weight;
      totalWeight += weight;
    }

    let velocityX = totalX / totalWeight;
    let velocityY = totalY / totalWeight;

    // Scale velocity for smoother feel
    velocityX *= 0.5;
    velocityY *= 0.5;

    // Cap velocity
    const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    if (magnitude > config.maxVelocity) {
      const scale = config.maxVelocity / magnitude;
      velocityX *= scale;
      velocityY *= scale;
    }

    return { velocityX, velocityY };
  }, [config.maxVelocity]);

  /**
   * End tracking and return final velocity
   */
  const endTracking = useCallback((): { velocityX: number; velocityY: number } => {
    const velocity = calculateVelocity();
    velocityHistoryRef.current = [];
    lastPositionRef.current = null;

    setState((prev) => ({
      ...prev,
      velocityX: velocity.velocityX,
      velocityY: velocity.velocityY,
    }));

    return velocity;
  }, [calculateVelocity]);

  /**
   * Start momentum animation after gesture release
   */
  const startMomentum = useCallback(
    (
      initialVelocityX: number,
      initialVelocityY: number,
      onUpdate: (x: number, y: number) => void
    ) => {
      let velocityX = initialVelocityX;
      let velocityY = initialVelocityY;

      // Check if velocity is above threshold
      const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
      if (magnitude < config.minVelocity) {
        return;
      }

      setState((prev) => ({
        ...prev,
        velocityX,
        velocityY,
        isAnimating: true,
      }));

      let x = 0;
      let y = 0;

      function animate() {
        // Apply friction
        velocityX *= config.friction;
        velocityY *= config.friction;

        // Update position
        x += velocityX;
        y += velocityY;

        // Check if we should stop
        const currentMagnitude = Math.sqrt(
          velocityX * velocityX + velocityY * velocityY
        );

        if (currentMagnitude < config.minVelocity) {
          setState((prev) => ({
            ...prev,
            velocityX: 0,
            velocityY: 0,
            isAnimating: false,
          }));
          animationFrameRef.current = null;
          return;
        }

        // Call update callback
        onUpdate(x, y);

        // Continue animation
        animationFrameRef.current = requestAnimationFrame(animate);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [config.friction, config.minVelocity]
  );

  /**
   * Stop momentum animation
   */
  const stopMomentum = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      velocityX: 0,
      velocityY: 0,
      isAnimating: false,
    }));
  }, []);

  return {
    state,
    startTracking,
    updateTracking,
    endTracking,
    startMomentum,
    stopMomentum,
  };
}

/**
 * Easing function for smooth deceleration
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Spring animation helper
 */
export function springAnimation(
  from: number,
  to: number,
  velocity: number,
  stiffness: number = 100,
  damping: number = 10
): { position: number; velocity: number; done: boolean } {
  const displacement = to - from;
  const springForce = stiffness * displacement;
  const dampingForce = damping * velocity;
  const acceleration = springForce - dampingForce;

  const newVelocity = velocity + acceleration * 0.016; // Assuming 60fps
  const newPosition = from + newVelocity * 0.016;

  const done =
    Math.abs(displacement) < 0.01 && Math.abs(newVelocity) < 0.01;

  return {
    position: done ? to : newPosition,
    velocity: done ? 0 : newVelocity,
    done,
  };
}
