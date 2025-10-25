import { useState, useRef } from "react";
import { GripVertical, X } from "lucide-react";
import ThreeJSGraph from "./ThreeJSGraph";
import type { GraphSpec } from "@/types";

interface GraphData {
  id: string;
  x: number | string;
  y: number | string;
  title: string;
  data: any[];
  layout?: any;
  graphSpec?: GraphSpec; // For Three.js mathematical graphs
}

interface DraggableGraphProps {
  graph: GraphData;
  onPositionChange: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
}

export default function DraggableGraph({ graph, onPositionChange, onRemove }: DraggableGraphProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({
    x: parseInt(String(graph.x)) || 100,
    y: parseInt(String(graph.y)) || 100,
  });
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
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
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onPositionChange(graph.id, position.x, position.y);
    }
  };

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "default",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="bg-card border-2 border-border rounded-lg shadow-lg overflow-hidden">
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50 drag-handle cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripVertical size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium select-none">
              {graph.title}
            </span>
          </div>
          <button
            onClick={() => onRemove(graph.id)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="pointer-events-auto p-4">
          {graph.graphSpec ? (
            <div className="w-[500px] h-[400px]">
              <ThreeJSGraph 
                graphSpec={graph.graphSpec} 
                width={500} 
                height={400} 
              />
            </div>
          ) : (
            <div className="w-[500px] h-[400px] bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
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
      </div>
    </div>
  );
}
