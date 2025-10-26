import { useRef, useEffect } from "react";
import type { ReactNode } from "react";

interface CanvasContainerProps {
  children: ReactNode;
  canvasSize: { width: number; height: number };
  onCanvasSizeChange: (size: { width: number; height: number }) => void;
  cursorStyle: string;
  className?: string;
  canvasContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function CanvasContainer({
  children,
  canvasSize,
  onCanvasSizeChange,
  cursorStyle,
  className = "flex-1 relative bg-muted/30 dark:bg-neutral-900 overflow-auto scrollbar-hide",
  canvasContainerRef: externalRef,
}: CanvasContainerProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = externalRef || internalRef;

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

  return (
    <div
      ref={canvasContainerRef}
      className={className}
      style={{ cursor: cursorStyle }}
    >
      {children}
    </div>
  );
}
