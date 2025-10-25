import { useState, useRef } from "react";
import Plot from "react-plotly.js";
import { GripVertical, X } from "lucide-react";

export default function DraggableGraph({ graph, onPositionChange, onRemove }) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({
    x: parseInt(graph.x) || 100,
    y: parseInt(graph.y) || 100,
  });
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handleMouseDown = (e) => {
    // Only allow dragging from the header
    if (e.target.closest(".drag-handle")) {
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: position.x,
        initialY: position.y,
      };
    }
  };

  const handleMouseMove = (e) => {
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
        <div className="pointer-events-auto">
          <Plot
            data={graph.data}
            layout={{
              width: 500,
              height: 400,
              margin: { l: 50, r: 30, t: 30, b: 50 },
              paper_bgcolor: "white",
              plot_bgcolor: "#fafafa",
              ...graph.layout,
            }}
            config={{
              displayModeBar: true,
              displaylogo: false,
              modeBarButtonsToRemove: ["toImage"],
            }}
          />
        </div>
      </div>
    </div>
  );
}
