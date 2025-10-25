import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResizablePanel({
  children,
  defaultWidth = 256,
  minWidth = 200,
  maxWidth = 600,
  side = "left", // "left" or "right"
}) {
  const [width, setWidth] = useState(defaultWidth);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(defaultWidth);
  const collapsedWidthRef = useRef(defaultWidth);

  const handleMouseDown = (e) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;

    const delta = e.clientX - startXRef.current;
    const newWidth = Math.max(
      minWidth,
      Math.min(maxWidth, startWidthRef.current + delta)
    );
    setWidth(newWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const toggleCollapse = () => {
    if (isCollapsed) {
      setWidth(collapsedWidthRef.current);
      setIsCollapsed(false);
    } else {
      collapsedWidthRef.current = width;
      setWidth(0);
      setIsCollapsed(true);
    }
  };

  return (
    <>
      <div
        style={{ width: isCollapsed ? "0px" : `${width}px` }}
        className="relative flex-shrink-0 transition-all duration-200"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className={isCollapsed ? "hidden" : ""}>{children}</div>

        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors group"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute top-0 right-0 w-1 h-full bg-transparent group-hover:bg-primary/50" />
          </div>
        )}

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-1/2 -translate-y-1/2 ${
            isCollapsed ? "-right-8" : "-right-4"
          } z-20 h-16 w-4 rounded-l-md rounded-r-none bg-card border border-r-0 border-border shadow-sm hover:bg-accent`}
          onClick={toggleCollapse}
        >
          {isCollapsed ? (
            side === "left" ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )
          ) : side === "left" ? (
            <ChevronLeft size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </Button>
      </div>
    </>
  );
}
