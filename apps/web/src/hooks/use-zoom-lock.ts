import { useEffect } from "react";

/**
 * Hook that disables pinch-to-zoom gestures on the entire page.
 * This prevents both touch and trackpad zoom gestures while allowing the canvas to handle its own zoom.
 * Essential for canvas editors where UI panels shouldn't trigger browser zoom.
 */
function useZoomLock() {
  useEffect(() => {
    // Prevent trackpad pinch zoom on desktop
    const preventWheelZoom = (event: WheelEvent) => {
      // Check if this is a pinch gesture (Ctrl/Cmd + wheel)
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };

    // Prevent touch-based zoom on mobile/tablets
    const preventTouchZoom = (event: TouchEvent) => {
      // Prevent zoom on multi-touch gestures
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };

    // Prevent gesture-based zoom (Safari specific)
    const preventGestureZoom = (event: Event) => {
      event.preventDefault();
    };

    // Prevent keyboard zoom shortcuts
    const preventKeyboardZoom = (event: KeyboardEvent) => {
      // Prevent Ctrl/Cmd + Plus/Minus/0
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "+" ||
          event.key === "-" ||
          event.key === "0" ||
          event.key === "=" ||
          event.code === "Equal" ||
          event.code === "Minus" ||
          event.code === "Digit0")
      ) {
        event.preventDefault();
      }
    };

    // Desktop: Prevent trackpad pinch zoom
    document.addEventListener("wheel", preventWheelZoom, { passive: false });

    // Mobile/Tablet: Prevent touch-based zoom
    document.addEventListener("touchmove", preventTouchZoom, { passive: false });

    // Safari: Prevent gesture-based zoom
    document.addEventListener("gesturestart", preventGestureZoom);
    document.addEventListener("gesturechange", preventGestureZoom);
    document.addEventListener("gestureend", preventGestureZoom);

    // All: Prevent keyboard zoom shortcuts
    document.addEventListener("keydown", preventKeyboardZoom);

    return () => {
      document.removeEventListener("wheel", preventWheelZoom);
      document.removeEventListener("touchmove", preventTouchZoom);
      document.removeEventListener("gesturestart", preventGestureZoom);
      document.removeEventListener("gesturechange", preventGestureZoom);
      document.removeEventListener("gestureend", preventGestureZoom);
      document.removeEventListener("keydown", preventKeyboardZoom);
    };
  }, []);
}

export { useZoomLock };
