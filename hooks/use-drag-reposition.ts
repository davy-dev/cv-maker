import { useRef, useCallback, useState } from "react";
import type { ImagePosition } from "@/types/cv";

interface UseDragRepositionOptions {
  position: ImagePosition;
  onPositionChange: (position: ImagePosition) => void;
  enabled: boolean;
}

export function useDragReposition({
  position: externalPosition,
  onPositionChange,
  enabled,
}: UseDragRepositionOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [localPosition, setLocalPosition] = useState(externalPosition);
  const startPointer = useRef({ x: 0, y: 0 });
  const startPosition = useRef(externalPosition);
  const containerSize = useRef({ width: 0, height: 0 });

  // Sync local state when external position changes (reset, new image)
  const [prevExternal, setPrevExternal] = useState(externalPosition);
  if (
    prevExternal.x !== externalPosition.x ||
    prevExternal.y !== externalPosition.y
  ) {
    setPrevExternal(externalPosition);
    setLocalPosition(externalPosition);
  }

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const rect = e.currentTarget.getBoundingClientRect();
      containerSize.current = { width: rect.width, height: rect.height };
      startPointer.current = { x: e.clientX, y: e.clientY };
      startPosition.current = { ...localPosition };
      setIsDragging(true);
    },
    [enabled, localPosition],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startPointer.current.x;
      const dy = e.clientY - startPointer.current.y;

      // Moving pointer right => image pans right => visible area shifts left => decrease x%
      const pctDx = (dx / containerSize.current.width) * -100;
      const pctDy = (dy / containerSize.current.height) * -100;

      const newPos = {
        x: Math.max(0, Math.min(100, startPosition.current.x + pctDx)),
        y: Math.max(0, Math.min(100, startPosition.current.y + pctDy)),
      };
      setLocalPosition(newPos);
    },
    [isDragging],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      setIsDragging(false);
      onPositionChange(localPosition);
    },
    [isDragging, localPosition, onPositionChange],
  );

  return {
    isDragging,
    position: localPosition,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
  };
}
