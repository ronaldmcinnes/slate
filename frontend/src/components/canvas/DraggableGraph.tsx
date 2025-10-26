import { useState, useRef } from "react";
import { GripVertical, X, RefreshCw, Edit3, Move } from "lucide-react";
import GraphRouter from "./GraphRouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AudioRecordingService } from "@/lib/audioService";
import type { GraphSpec } from "@/types";

interface GraphData {
  id: string;
  x: number | string;
  y: number | string;
  title: string;
  data: any[];
  layout?: any;
  graphSpec?: GraphSpec; // For Three.js mathematical graphs
  size?: { width: number; height: number };
  cameraState?: {
    position: [number, number, number];
    rotation: [number, number, number];
    zoom: number;
  };
}

interface DraggableGraphProps {
  graph: GraphData;
  onPositionChange: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  onUpdateGraph?: (id: string, newGraphSpec: GraphSpec) => void;
  onSizeChange?: (id: string, width: number, height: number) => void;
  onCameraChange?: (id: string, cameraState: {
    position: [number, number, number];
    rotation: [number, number, number];
    zoom: number;
  }) => void;
}

// Helper function to get chart type display name
const getChartTypeDisplay = (graph: GraphData): string => {
  if (graph.graphSpec) {
    switch (graph.graphSpec.graphType) {
      case 'chart':
        if (graph.graphSpec.chart) {
          const chartKind = graph.graphSpec.chart.kind;
          switch (chartKind) {
            case 'bar': return 'Bar Chart';
            case 'line': return 'Line Chart';
            case 'scatter': return 'Scatter Plot';
            case 'pie': return 'Pie Chart';
            case 'area': return 'Area Chart';
            case 'histogram': return 'Histogram';
            default: return 'Chart';
          }
        }
        return 'Chart';
      case 'statistical':
        if (graph.graphSpec.statistics) {
          const statsKind = graph.graphSpec.statistics.kind;
          switch (statsKind) {
            case 'distribution': return 'Distribution Analysis';
            case 'correlation': return 'Correlation Analysis';
            case 'regression': return 'Regression Analysis';
            case 'anova': return 'ANOVA Box Plot';
            default: return 'Statistical Analysis';
          }
        }
        return 'Statistical Analysis';
      case 'mathematical':
        return 'Mathematical Graph';
      default:
        return 'Graph';
    }
  }
  return 'Graph';
};

export default function DraggableGraph({ graph, onPositionChange, onRemove, onUpdateGraph, onSizeChange, onCameraChange }: DraggableGraphProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState("");
  const [position, setPosition] = useState({
    x: parseInt(String(graph.x)) || 100,
    y: parseInt(String(graph.y)) || 100,
  });
  const [size, setSize] = useState({
    width: graph.size?.width || 500,
    height: graph.size?.height || 400,
  });
  const [functionInput, setFunctionInput] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showFunctionInput, setShowFunctionInput] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const resizeRef = useRef({ startX: 0, startY: 0, initialWidth: 0, initialHeight: 0, initialX: 0, initialY: 0 });
  const audioService = useRef(new AudioRecordingService());

  const handleMouseDown = (e: React.MouseEvent) => {
    // Check if clicking on resize handle
    const resizeHandle = (e.target as Element).closest(".resize-handle");
    if (resizeHandle) {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setResizeDirection(resizeHandle.getAttribute("data-direction") || "");
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialWidth: size.width,
        initialHeight: size.height,
        initialX: position.x,
        initialY: position.y,
      };
      return;
    }

    // Only allow dragging from the header
    if ((e.target as Element).closest(".drag-handle")) {
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: position.x,
        initialY: position.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + deltaX,
        y: dragRef.current.initialY + deltaY,
      });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeRef.current.startX;
      const deltaY = e.clientY - resizeRef.current.startY;
      
      let newWidth = resizeRef.current.initialWidth;
      let newHeight = resizeRef.current.initialHeight;
      let newX = resizeRef.current.initialX;
      let newY = resizeRef.current.initialY;

      if (resizeDirection.includes("right")) {
        newWidth = Math.max(200, resizeRef.current.initialWidth + deltaX);
      }
      if (resizeDirection.includes("left")) {
        newWidth = Math.max(200, resizeRef.current.initialWidth - deltaX);
        newX = resizeRef.current.initialX + deltaX;
      }
      if (resizeDirection.includes("bottom")) {
        newHeight = Math.max(200, resizeRef.current.initialHeight + deltaY);
      }
      if (resizeDirection.includes("top")) {
        newHeight = Math.max(200, resizeRef.current.initialHeight - deltaY);
        newY = resizeRef.current.initialY + deltaY;
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onPositionChange(graph.id, position.x, position.y);
    } else if (isResizing) {
      setIsResizing(false);
      setResizeDirection("");
      onPositionChange(graph.id, position.x, position.y);
      if (onSizeChange) {
        onSizeChange(graph.id, size.width, size.height);
      }
    }
  };

  const handleRegenerateGraph = async () => {
    if (!functionInput.trim() || !onUpdateGraph) return;
    
    try {
      setIsRegenerating(true);
      const newGraphSpec = await audioService.current.interpretTranscription(functionInput.trim());
      onUpdateGraph(graph.id, newGraphSpec);
      setShowFunctionInput(false);
      setFunctionInput("");
    } catch (error) {
      console.error("Failed to regenerate graph:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleRegenerateGraph();
    } else if (e.key === "Escape") {
      setShowFunctionInput(false);
      setFunctionInput("");
    }
  };

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : isResizing ? "grabbing" : "default",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="bg-card border-2 border-border rounded-lg shadow-lg overflow-hidden relative"
        style={{ 
          width: `${size.width}px`, 
          height: `${showFunctionInput ? size.height + 90 : size.height}px` 
        }}
      >
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50 drag-handle cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripVertical size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium select-none">
              {getChartTypeDisplay(graph)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {onUpdateGraph && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFunctionInput(!showFunctionInput);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                title="Edit function definition"
              >
                <Edit3 size={14} />
              </button>
            )}
            <button
              onClick={() => onRemove(graph.id)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="pointer-events-auto p-4">
          {graph.graphSpec ? (
            <div style={{ width: `${size.width - 32}px`, height: `${size.height - 100}px` }}>
              <GraphRouter 
                graphSpec={graph.graphSpec} 
                width={size.width - 32} 
                height={size.height - 100}
                cameraState={graph.cameraState}
                onCameraChange={(cameraState) => onCameraChange?.(graph.id, cameraState)}
              />
            </div>
          ) : (
            <div 
              className="bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center"
              style={{ width: `${size.width - 32}px`, height: `${size.height - 100}px` }}
            >
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-sm font-medium">Graph Visualization</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Plotly.js dependency removed
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Function Definition Input */}
        {showFunctionInput && onUpdateGraph && (
          <div className="border-t border-border p-3 bg-muted/30">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Function Definition:
              </label>
              <div className="flex gap-2">
                <Input
                  value={functionInput}
                  onChange={(e) => setFunctionInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="e.g., f(x,y) = x^2 + y^2 or z = sin(x*y)"
                  className="flex-1 text-sm"
                  disabled={isRegenerating}
                />
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRegenerateGraph();
                  }}
                  disabled={!functionInput.trim() || isRegenerating}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  {isRegenerating ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  {isRegenerating ? "Regenerating..." : "Regenerate"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Press Enter to regenerate, Escape to cancel
              </p>
            </div>
          </div>
        )}
        
        {/* Resize Handles - Only show when not in function input mode */}
        {!showFunctionInput && (
          <>
            <div className="resize-handle absolute top-0 left-0 w-2 h-2 cursor-nw-resize" data-direction="top-left" onMouseDown={handleMouseDown}></div>
            <div className="resize-handle absolute top-0 right-0 w-2 h-2 cursor-ne-resize" data-direction="top-right" onMouseDown={handleMouseDown}></div>
            <div className="resize-handle absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize" data-direction="bottom-left" onMouseDown={handleMouseDown}></div>
            <div className="resize-handle absolute bottom-0 right-0 w-2 h-2 cursor-se-resize" data-direction="bottom-right" onMouseDown={handleMouseDown}></div>
            <div className="resize-handle absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 cursor-n-resize" data-direction="top" onMouseDown={handleMouseDown}></div>
            <div className="resize-handle absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 cursor-s-resize" data-direction="bottom" onMouseDown={handleMouseDown}></div>
            <div className="resize-handle absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 cursor-w-resize" data-direction="left" onMouseDown={handleMouseDown}></div>
            <div className="resize-handle absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 cursor-e-resize" data-direction="right" onMouseDown={handleMouseDown}></div>
          </>
        )}
      </div>
    </div>
  );
}
