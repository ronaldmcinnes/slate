import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  side?: "left" | "right";
  panelId?: string;
  activePanel?: string | null;
  onInteractionChange?: (panelId: string | null) => void;
}

export default function ResizablePanel({
  children,
  defaultWidth = 256,
  minWidth = 200,
  maxWidth = 600,
  side = "left",
  panelId = "",
  activePanel = null,
  onInteractionChange = () => {},
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(defaultWidth);
  const collapsedWidthRef = useRef(defaultWidth);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    onInteractionChange(panelId);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isResizing) return;

    const delta = e.clientX - startXRef.current;
    const newWidth = Math.max(
      0,
      Math.min(maxWidth, startWidthRef.current + delta)
    );

    // Auto-collapse when dragged below threshold (half of minWidth)
    if (newWidth < minWidth / 2) {
      setWidth(0);
      setIsCollapsed(true);
      collapsedWidthRef.current = startWidthRef.current;
    } else if (newWidth < minWidth) {
      // Snap to minWidth if between threshold and minWidth
      setWidth(minWidth);
      if (isCollapsed) {
        setIsCollapsed(false);
      }
    } else {
      setWidth(newWidth);
      if (isCollapsed) {
        setIsCollapsed(false);
      }
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    onInteractionChange(null);
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
        style={{ width: isCollapsed ? "20px" : `${width}px` }}
        className="relative flex-shrink-0 transition-all duration-200"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className={isCollapsed ? "hidden" : "overflow-hidden"}>
          {children}
        </div>

        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            className="absolute top-0 -right-[12px] h-full w-6 flex items-center justify-center group z-30"
            onMouseEnter={() => onInteractionChange(panelId)}
            onMouseLeave={() => {
              if (!isResizing) {
                onInteractionChange(null);
              }
            }}
          >
            {/* Hover area for easier grabbing */}
            <div
              className="absolute inset-0 cursor-col-resize"
              onMouseDown={handleMouseDown}
            />

            {/* Visible divider line */}
            <div
              className={`absolute w-[1px] h-full cursor-col-resize transition-all ${
                isResizing
                  ? "bg-primary"
                  : "bg-border group-hover:bg-primary/60"
              }`}
              onMouseDown={handleMouseDown}
            />

            {/* Toggle Button - centered on divider */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 -translate-y-1/2 h-12 w-5 p-0 bg-card border border-border hover:bg-accent rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-40"
              onClick={toggleCollapse}
            >
              {side === "left" ? (
                <ChevronLeft size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
            </Button>
          </div>
        )}

        {/* Collapsed state button - hide when another panel is active */}
        {isCollapsed && (activePanel === null || activePanel === panelId) && (
          <div className="absolute top-0 left-0 h-full w-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-5 p-0 bg-card border border-border hover:bg-accent rounded shadow-sm"
              onClick={toggleCollapse}
            >
              {side === "left" ? (
                <ChevronRight size={12} />
              ) : (
                <ChevronLeft size={12} />
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
