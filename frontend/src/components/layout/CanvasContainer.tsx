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
}

export default function CanvasContainer({
  children,
  canvasSize,
  onCanvasSizeChange,
  cursorStyle,
  className = "flex-1 relative bg-[#FAFAFA] dark:bg-[#111111] overflow-auto scrollbar-hide",
  canvasContainerRef: externalRef,
  isReadOnly = false,
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

  // Panning functionality for view-only mode
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || !isReadOnly) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only start panning on left mouse button
      if (e.button !== 0) return;

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
  }, [isPanning, panStart, isReadOnly]);

  return (
    <div
      ref={canvasContainerRef}
      className={className}
      style={{
        cursor: isPanning ? "grabbing" : cursorStyle,
        userSelect: isReadOnly ? "none" : "auto",
        // Ensure the container has scrollable content for view-only mode
        minWidth: isReadOnly ? `${canvasSize.width}%` : undefined,
        minHeight: isReadOnly ? `${canvasSize.height}%` : undefined,
      }}
    >
      {children}
    </div>
  );
}
