import { useRef, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface CanvasContainerProps {
  children: ReactNode;
  canvasSize: { width: number; height: number };
  onCanvasSizeChange: (size: { width: number; height: number }) => void;
  cursorStyle: string;
  className?: string;
  canvasContainerRef?: React.RefObject<HTMLDivElement | null>;
  isReadOnly?: boolean;
  isPanActive?: boolean;
  zoom?: number;
}

export default function CanvasContainer({
  children,
  canvasSize,
  onCanvasSizeChange,
  cursorStyle,
  className = "flex-1 relative bg-background overflow-auto scrollbar-hide",
  canvasContainerRef: externalRef,
  isReadOnly = false,
  isPanActive = false,
  zoom = 1,
}: CanvasContainerProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = externalRef || internalRef;
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  // Auto-expand canvas when scrolling near edges
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const {
        scrollTop,
        scrollLeft,
        scrollHeight,
        scrollWidth,
        clientHeight,
        clientWidth,
      } = container;

      const expandThreshold = 300; // pixels from edge to trigger expansion
      let needsExpansion = false;
      let newSize = { ...canvasSize };

      // Check if scrolled near bottom edge
      if (scrollHeight - (scrollTop + clientHeight) < expandThreshold) {
        newSize.height = canvasSize.height + 50;
        needsExpansion = true;
      }

      // Check if scrolled near right edge
      if (scrollWidth - (scrollLeft + clientWidth) < expandThreshold) {
        newSize.width = canvasSize.width + 50;
        needsExpansion = true;
      }

      if (needsExpansion) {
        onCanvasSizeChange(newSize);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [canvasSize, onCanvasSizeChange]);

  // Panning functionality for view-only mode or when pan tool is active
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || (!isReadOnly && !isPanActive)) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only start panning on left mouse button
      if (e.button !== 0) return;

      // If pan tool is active (not read-only), but the user clicked inside an interactive overlay (graphs/text), skip panning
      if (!isReadOnly && isPanActive) {
        const target = e.target as HTMLElement | null;
        const interactive = target?.closest?.('[data-interactive]');
        if (interactive) {
          return; // let the interactive element handle drag
        }
      }

      // In view-only mode, always start panning regardless of what element was clicked
      setIsPanning(true);
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        scrollLeft: container.scrollLeft,
        scrollTop: container.scrollTop,
      });

      // Prevent text selection while panning
      e.preventDefault();
      e.stopPropagation();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;

      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;

      // Use normal scrolling for canvas navigation
      container.scrollLeft = panStart.scrollLeft - deltaX;
      container.scrollTop = panStart.scrollTop - deltaY;

      e.preventDefault();
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    const handleMouseLeave = () => {
      setIsPanning(false);
    };

    // Add event listeners to document to capture events from overlay elements
    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isPanning, panStart, isReadOnly, isPanActive]);

  // Zoom functionality: Ctrl+scroll and two-finger pinch (touch)
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || !isPanActive) return;

    const handleWheel = (e: WheelEvent) => {
      // Ctrl+scroll or Cmd+scroll for zoom
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
        // Zoom is managed by parent via zoom prop, so we dispatch a custom event
        const newZoom = Math.max(0.1, Math.min(5, zoom * zoomDelta));
        window.dispatchEvent(
          new CustomEvent("slate-canvas-zoom", { detail: { zoom: newZoom } })
        );
      }
    };

    // Two-finger pinch zoom for touch devices
    let initialDistance = 0;
    let initialZoom = zoom;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        initialZoom = zoom;
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (initialDistance > 0) {
          const scale = currentDistance / initialDistance;
          const newZoom = Math.max(
            0.1,
            Math.min(5, initialZoom * scale)
          );
          window.dispatchEvent(
            new CustomEvent("slate-canvas-zoom", { detail: { zoom: newZoom } })
          );
        }
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      initialDistance = 0;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPanActive, zoom]);

  // Apply zoom transform
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    // Find the canvas element inside
    const canvasElement = container.querySelector(
      "[data-react-sketch-canvas]"
    ) as HTMLElement;
    if (canvasElement) {
      canvasElement.style.transform = `scale(${zoom})`;
      canvasElement.style.transformOrigin = "top left";
    }
  }, [zoom]);

  return (
    <div
      ref={canvasContainerRef}
      className={className}
      data-canvas-container
      style={{
        cursor: isPanning ? "grabbing" : cursorStyle,
        userSelect: isReadOnly || isPanActive ? "none" : "auto",
        // Ensure the container has scrollable content for view-only mode
        minWidth: isReadOnly ? `${canvasSize.width}%` : undefined,
        minHeight: isReadOnly ? `${canvasSize.height}%` : undefined,
      }}
    >
      {children}
    </div>
  );
}
