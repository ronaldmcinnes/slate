import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import ToolbarDrawingTools from "./ToolbarDrawingTools";
import ToolbarActions from "./ToolbarActions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Hand, Lasso, ChevronDown } from "lucide-react";

interface CanvasToolbarProps {
  isToolbarVisible: boolean;
  onToggleVisibility: () => void;
  tool: string;
  onToolChange: (tool: string, color?: string, width?: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  onClearCanvas: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  isTranscribing: boolean;
  isInterpreting: boolean;
  visibleTools: Record<string, boolean>;
  onToggleTool: (toolId: string) => void;
  isReadOnly: boolean;
  toolbarScrollRef: React.RefObject<HTMLDivElement | null>;
  onScrollLeft: () => void;
  onScrollRight: () => void;
  onAddGraph: () => void;
}

export default function CanvasToolbar({
  isToolbarVisible,
  onToggleVisibility,
  tool,
  onToolChange,
  onUndo,
  onRedo,
  onSave,
  hasUnsavedChanges,
  onClearCanvas,
  onStartRecording,
  onStopRecording,
  isRecording,
  isTranscribing,
  isInterpreting,
  visibleTools,
  onToggleTool,
  isReadOnly,
  toolbarScrollRef,
  onScrollLeft,
  onScrollRight,
  onAddGraph,
}: CanvasToolbarProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [undoMenuOpen, setUndoMenuOpen] = useState(false);

  useEffect(() => {
    const el = toolbarScrollRef?.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    const onScroll = () => {
      update();
      window.dispatchEvent(new CustomEvent("slate-toolbar-scroll"));
      setUndoMenuOpen(false);
    };
    el.addEventListener("scroll", onScroll);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [toolbarScrollRef]);
  if (!isToolbarVisible) {
    return (
      <Button
        data-toolbar
        variant="secondary"
        size="icon"
        className="sticky top-4 left-1/2 transform -translate-x-1/2 z-50 h-10 w-10 rounded-full shadow-lg"
        onClick={onToggleVisibility}
        title="Show Toolbar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </Button>
    );
  }

  return (
    <div
      data-toolbar
      className="sticky top-4 left-1/2 transform -translate-x-1/2 z-20 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg max-w-[60%] w-fit"
    >
      <div className="flex items-center gap-2 px-2 py-3">
        {/* Static Tools - Always Visible */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Undo with dropdown for Redo */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-muted"
              onClick={onUndo}
              title="Undo (Ctrl+Z)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </Button>
            <Popover open={undoMenuOpen} onOpenChange={setUndoMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-9 rounded-t-none py-0 flex items-center justify-center"
                  title="More"
                >
                  <ChevronDown size={10} />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-2 rounded-t-none border-t-0 shadow-md bg-card z-50"
                side="bottom"
                align="center"
                sideOffset={0}
              >
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onRedo}
                    title="Redo (Ctrl+Y)"
                    aria-label="Redo"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 7v6h-6" />
                      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                    </svg>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-px h-8 bg-border mx-1" />

          {/* Save Button */}
          <Button
            variant={hasUnsavedChanges ? "default" : "ghost"}
            size="icon"
            className={`h-9 w-9 ${
              hasUnsavedChanges
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "hover:bg-muted"
            }`}
            onClick={onSave}
            title={
              hasUnsavedChanges
                ? "Save Page (Ctrl+S) - Unsaved Changes"
                : "Save Page (Ctrl+S)"
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17,21 17,13 7,13 7,21" />
              <polyline points="7,3 7,8 15,8" />
            </svg>
          </Button>

          <div className="w-px h-8 bg-border mx-1" />

          {/* Pan and Lasso */}
          <Button
            variant={tool === "pan" ? "secondary" : "ghost"}
            size="icon"
            className={`h-9 w-9 ${tool === "pan" ? "bg-muted" : ""}`}
            onClick={() => onToolChange("pan")}
            title="Pan Tool"
          >
            <Hand size={18} />
          </Button>
          <Button
            variant={tool === "lasso" ? "secondary" : "ghost"}
            size="icon"
            className={`h-9 w-9 ${tool === "lasso" ? "bg-muted" : ""}`}
            onClick={() => onToolChange("lasso")}
            title="Lasso Tool"
          >
            <Lasso size={18} />
          </Button>

          {/* Audio Recording */}
          <Button
            onMouseDown={onStartRecording}
            onMouseUp={onStopRecording}
            onTouchStart={onStartRecording}
            onTouchEnd={onStopRecording}
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            className={`h-9 w-9 hover:bg-muted ${
              isTranscribing || isInterpreting
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            disabled={isTranscribing || isInterpreting}
            title={
              isTranscribing
                ? "Transcribing..."
                : isInterpreting
                ? "Interpreting..."
                : isRecording
                ? "Release to stop recording"
                : "Hold to record audio"
            }
          >
            {isTranscribing || isInterpreting ? (
              <LoadingSpinner size="sm" text="" showText={false} />
            ) : isRecording ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" x2="12" y1="2" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            )}
          </Button>
        </div>

        <div className="w-px h-12 bg-border flex-shrink-0" />

        {/* Left Scroll Arrow */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-7 flex-shrink-0 ${
            canScrollLeft ? "hover:bg-muted" : "opacity-50 cursor-not-allowed"
          }`}
          onClick={canScrollLeft ? onScrollLeft : undefined}
          title="Scroll Left"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Button>

        {/* Scrollable Toolbar Content */}
        <div
          ref={toolbarScrollRef}
          className="flex items-center gap-3 overflow-x-auto scrollbar-hide max-w-[180px]"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {!isReadOnly && (
            <>
              <ToolbarDrawingTools
                tool={tool}
                onToolChange={onToolChange}
                visibleTools={visibleTools}
              />

              <div className="w-px h-10 bg-border flex-shrink-0" />

              <ToolbarActions
                onAddGraph={onAddGraph}
                visibleTools={visibleTools}
              />
            </>
          )}
          {isReadOnly && (
            <div className="text-sm text-orange-600 font-medium px-3">
              View Only - Editing Disabled
            </div>
          )}
        </div>

        {/* Right Scroll Arrow */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-7 flex-shrink-0 ${
            canScrollRight ? "hover:bg-muted" : "opacity-50 cursor-not-allowed"
          }`}
          onClick={canScrollRight ? onScrollRight : undefined}
          title="Scroll Right"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Button>

        <div className="w-px h-10 bg-border flex-shrink-0" />

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-muted flex-shrink-0"
          onClick={onToggleVisibility}
          title="Hide Toolbar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
