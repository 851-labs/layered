import { useEffect } from "react";

/**
 * Hook that disables back/forward swipe gestures (browser history navigation).
 * This prevents both touch and trackpad horizontal swipe gestures that trigger browser history navigation.
 * Essential for canvas editors and interactive UIs where horizontal gestures should not affect browser navigation.
 */
function useNavigationSwipeLock() {
  useEffect(() => {
    // Add data attribute to body for CSS targeting (similar to Base UI's pattern)
    document.body.setAttribute("data-navigation-locked", "true");

    // Apply styles directly to prevent overscroll navigation
    const originalOverscrollX = document.body.style.overscrollBehaviorX;
    const originalHtmlOverscrollX = document.documentElement.style.overscrollBehaviorX;

    document.body.style.overscrollBehaviorX = "none";
    document.documentElement.style.overscrollBehaviorX = "none";

    // Prevent trackpad horizontal swipe navigation on desktop
    // On macOS, browser back/forward is often triggered by horizontal swipe gestures
    // We need to aggressively prevent these to avoid navigation
    const preventSwipeNavigation = (event: WheelEvent): void => {
      // Check if this is a horizontal scroll (including trackpad swipes)
      if (Math.abs(event.deltaX) > 0) {
        event.preventDefault();
      }
    };

    // Prevent touch-based swipe navigation on mobile/tablets
    let touchStartX = 0;
    let touchStartY = 0;

    const preventTouchSwipe = (event: TouchEvent): void => {
      const firstTouch = event.touches[0];
      if (event.touches.length === 1 && firstTouch !== undefined) {
        touchStartX = firstTouch.clientX;
        touchStartY = firstTouch.clientY;
      }
    };

    const preventTouchMove = (event: TouchEvent): void => {
      const firstTouch = event.touches[0];
      if (event.touches.length === 1 && firstTouch !== undefined) {
        const touchX = firstTouch.clientX;
        const touchY = firstTouch.clientY;
        const deltaX = touchX - touchStartX;
        const deltaY = touchY - touchStartY;

        // Check if this is primarily a horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Check if swipe started near the edge of the screen (within 50px)
          const nearLeftEdge = touchStartX < 50;
          const nearRightEdge = touchStartX > window.innerWidth - 50;

          if (nearLeftEdge || nearRightEdge) {
            event.preventDefault();
          }
        }
      }
    };

    // Desktop: Prevent trackpad swipe navigation
    document.addEventListener("wheel", preventSwipeNavigation, { passive: false });

    // Mobile/Tablet: Prevent touch-based swipe navigation
    document.addEventListener("touchstart", preventTouchSwipe, { passive: true });
    document.addEventListener("touchmove", preventTouchMove, { passive: false });

    return () => {
      // Restore original values
      document.body.removeAttribute("data-navigation-locked");
      document.body.style.overscrollBehaviorX = originalOverscrollX;
      document.documentElement.style.overscrollBehaviorX = originalHtmlOverscrollX;

      document.removeEventListener("wheel", preventSwipeNavigation);
      document.removeEventListener("touchstart", preventTouchSwipe);
      document.removeEventListener("touchmove", preventTouchMove);
    };
  }, []);
}

export { useNavigationSwipeLock };
