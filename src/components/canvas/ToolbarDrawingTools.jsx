import { Undo, Redo, Eraser, Pencil, Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";

const PEN_COLORS = [
  { color: "#000000", label: "Black" },
  { color: "#EF4444", label: "Red" },
  { color: "#3B82F6", label: "Blue" },
  { color: "#8B5CF6", label: "Purple" },
  { color: "#10B981", label: "Green" },
];

const HIGHLIGHTER_COLORS = [
  { color: "#FEF08A", label: "Yellow" },
  { color: "#FCA5A5", label: "Pink" },
  { color: "#93C5FD", label: "Blue" },
  { color: "#C4B5FD", label: "Purple" },
  { color: "#6EE7B7", label: "Green" },
];

export default function ToolbarDrawingTools({
  tool,
  strokeColor,
  onUndo,
  onRedo,
  onToolChange,
}) {
  const handlePenColorChange = (color) => {
    onToolChange("pen", color, 2);
  };

  const handleHighlighterChange = (color) => {
    onToolChange("highlighter", color, 20);
  };

  const handleEraserChange = () => {
    onToolChange("eraser", "#FAFAFA", 10);
  };

  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={onUndo}
        title="Undo"
      >
        <Undo size={18} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={onRedo}
        title="Redo"
      >
        <Redo size={18} />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Eraser */}
      <Button
        variant={tool === "eraser" ? "secondary" : "ghost"}
        size="icon"
        className="h-9 w-9"
        onClick={handleEraserChange}
        title="Eraser"
      >
        <Eraser size={18} />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Pens with colors */}
      {PEN_COLORS.map((pen) => (
        <Button
          key={pen.color}
          variant={
            tool === "pen" && strokeColor === pen.color ? "secondary" : "ghost"
          }
          size="icon"
          className="h-9 w-9 relative"
          onClick={() => handlePenColorChange(pen.color)}
          title={`${pen.label} Pen`}
        >
          <div className="relative">
            <Pencil size={18} />
            <div
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
              style={{ backgroundColor: pen.color }}
            />
          </div>
        </Button>
      ))}

      <div className="w-px h-6 bg-border mx-1" />

      {/* Highlighters */}
      {HIGHLIGHTER_COLORS.map((highlighter) => (
        <Button
          key={highlighter.color}
          variant={
            tool === "highlighter" && strokeColor === highlighter.color
              ? "secondary"
              : "ghost"
          }
          size="icon"
          className="h-9 w-9 relative"
          onClick={() => handleHighlighterChange(highlighter.color)}
          title={`${highlighter.label} Highlighter`}
        >
          <div className="relative">
            <Highlighter size={18} />
            <div
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
              style={{ backgroundColor: highlighter.color }}
            />
          </div>
        </Button>
      ))}
    </div>
  );
}
