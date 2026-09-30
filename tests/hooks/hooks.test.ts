import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type React from "react";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import { useDragReposition } from "@/hooks/use-drag-reposition";

describe("useDebouncedCallback", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("n'appelle le callback qu'une fois, avec les derniers arguments", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    result.current("a");
    vi.advanceTimersByTime(300);
    result.current("b");
    vi.advanceTimersByTime(499);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledExactlyOnceWith("b");
  });
});

describe("useDragReposition", () => {
  function pointerEvent(clientX: number, clientY: number) {
    const target = {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
      getBoundingClientRect: () => ({ width: 200, height: 100 }),
    };
    return {
      clientX,
      clientY,
      pointerId: 1,
      preventDefault: vi.fn(),
      currentTarget: target,
    } as unknown as React.PointerEvent;
  }

  it("déplace la position en pourcentage et la borne entre 0 et 100", () => {
    const onPositionChange = vi.fn();
    const { result } = renderHook(() =>
      useDragReposition({ position: { x: 50, y: 50 }, onPositionChange, enabled: true })
    );

    act(() => result.current.handlers.onPointerDown(pointerEvent(100, 50)));
    expect(result.current.isDragging).toBe(true);

    // 20 px vers la droite sur 200 px de large → -10 %
    act(() => result.current.handlers.onPointerMove(pointerEvent(120, 50)));
    expect(result.current.position).toEqual({ x: 40, y: 50 });

    // Très loin vers le haut → y plafonné à 100
    act(() => result.current.handlers.onPointerMove(pointerEvent(120, -1000)));
    expect(result.current.position.y).toBe(100);

    act(() => result.current.handlers.onPointerUp(pointerEvent(120, -1000)));
    expect(result.current.isDragging).toBe(false);
    expect(onPositionChange).toHaveBeenCalledWith({ x: 40, y: 100 });
  });

  it("ignore le glisser quand il est désactivé", () => {
    const { result } = renderHook(() =>
      useDragReposition({ position: { x: 50, y: 50 }, onPositionChange: vi.fn(), enabled: false })
    );

    act(() => result.current.handlers.onPointerDown(pointerEvent(0, 0)));

    expect(result.current.isDragging).toBe(false);
  });

  it("se resynchronise quand la position externe change", () => {
    const { result, rerender } = renderHook(
      ({ position }) => useDragReposition({ position, onPositionChange: vi.fn(), enabled: true }),
      { initialProps: { position: { x: 50, y: 50 } } }
    );

    rerender({ position: { x: 10, y: 20 } });

    expect(result.current.position).toEqual({ x: 10, y: 20 });
  });
});
