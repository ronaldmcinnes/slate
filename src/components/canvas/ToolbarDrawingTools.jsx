import {
  Undo,
  Redo,
  Eraser,
  Pencil,
  Highlighter,
  Type,
  MousePointer2,
  ChevronDown,
  PenTool,
  Lasso,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_COLORS = [
  "#000000",
  "#EF4444",
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#6366F1",
  "#14B8A6",
  "#F97316",
  "#84CC16",
  "#A855F7",
  "#FFFFFF",
  "#9CA3AF",
  "#FEF08A",
  "#FCA5A5",
  "#93C5FD",
  "#C4B5FD",
];

export default function ToolbarDrawingTools({
  tool,
  strokeColor,
  strokeWidth,
  onUndo,
  onRedo,
  onToolChange,
}) {
  // Tool colors state
  const [marker1Color, setMarker1Color] = useState("#000000");
  const [marker2Color, setMarker2Color] = useState("#EF4444");
  const [marker3Color, setMarker3Color] = useState("#3B82F6");
  const [highlighterColor, setHighlighterColor] = useState("#FEF08A");
  const [fountainPenColor, setFountainPenColor] = useState("#000000");

  // Tool widths state
  const [marker1Width, setMarker1Width] = useState(3);
  const [marker2Width, setMarker2Width] = useState(3);
  const [marker3Width, setMarker3Width] = useState(3);
  const [highlighterWidth, setHighlighterWidth] = useState(20);
  const [fountainPenWidth, setFountainPenWidth] = useState(2);
  const [eraserWidth, setEraserWidth] = useState(10);

  // Eraser type state
  const [eraserType, setEraserType] = useState("area"); // "stroke" or "area"

  // Track which specific marker is active
  const [activeMarkerColor, setActiveMarkerColor] = useState(marker1Color);

  const handleToolSelect = (toolType, color, width) => {
    if (toolType === "marker") {
      setActiveMarkerColor(color);
    }
    onToolChange(toolType, color, width);
  };

  const ColorAndSizeButton = ({
    color,
    width,
    onColorChange,
    onWidthChange,
    isActive,
    onClick,
    icon: Icon,
    label,
    minWidth = 1,
    maxWidth = 30,
  }) => {
    const [popoverOpen, setPopoverOpen] = useState(false);

    return (
      <div className="flex flex-col items-center">
        <Button
          variant={isActive ? "secondary" : "ghost"}
          size="icon"
          className={cn("h-9 w-9", isActive ? "rounded-b-none" : "")}
          onClick={onClick}
          title={label}
        >
          <div className="relative">
            <Icon size={18} />
            <div
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
        </Button>
        {isActive && (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-3 w-9 rounded-t-none py-0 flex items-center justify-center"
              >
                <ChevronDown size={10} />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-3"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div
                className="space-y-3"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Color Picker */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Choose color</p>
                  <div className="grid grid-cols-6 gap-2">
                    {DEFAULT_COLORS.map((c) => (
                      <button
                        key={c}
                        className={cn(
                          "w-8 h-8 rounded border-2 hover:scale-110 transition-transform",
                          c === "#FFFFFF"
                            ? "border-border"
                            : "border-transparent"
                        )}
                        style={{ backgroundColor: c }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onColorChange(c);
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Size Slider */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Size</p>
                    <span className="text-xs text-muted-foreground">
                      {width}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={minWidth}
                    max={maxWidth}
                    value={width}
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      onWidthChange(Number(e.target.value));
                    }}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  };

  const EraserButton = () => {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const isActive = tool === "eraser";

    return (
      <div className="flex flex-col items-center">
        <Button
          variant={isActive ? "secondary" : "ghost"}
          size="icon"
          className={cn("h-9 w-9", isActive ? "rounded-b-none pb-1" : "")}
          onClick={() => handleToolSelect("eraser", "#FAFAFA", eraserWidth)}
          title="Eraser"
        >
          <Eraser size={18} />
        </Button>
        {isActive && (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-3 w-9 rounded-t-none py-0 flex items-center justify-center"
              >
                <ChevronDown size={10} />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-3"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div
                className="space-y-3"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Eraser Type */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Eraser Type</p>
                  <div className="flex gap-2">
                    <Button
                      variant={eraserType === "stroke" ? "default" : "outline"}
                      size="sm"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEraserType("stroke");
                        handleToolSelect("eraser", "#FAFAFA", eraserWidth);
                      }}
                      className="flex-1"
                    >
                      Stroke
                    </Button>
                    <Button
                      variant={eraserType === "area" ? "default" : "outline"}
                      size="sm"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEraserType("area");
                        handleToolSelect("eraser", "#FAFAFA", eraserWidth);
                      }}
                      className="flex-1"
                    >
                      Area
                    </Button>
                  </div>
                </div>

                {/* Size Slider */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Size</p>
                    <span className="text-xs text-muted-foreground">
                      {eraserWidth}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={40}
                    value={eraserWidth}
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      setEraserWidth(Number(e.target.value));
                      handleToolSelect(
                        "eraser",
                        "#FAFAFA",
                        Number(e.target.value)
                      );
                    }}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={onUndo}
        title="Undo (Ctrl+Z)"
      >
        <Undo size={18} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={onRedo}
        title="Redo (Ctrl+Y)"
      >
        <Redo size={18} />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Selection Tools */}
      <Button
        variant={tool === "select" ? "secondary" : "ghost"}
        size="icon"
        className="h-9 w-9"
        onClick={() => handleToolSelect("select", "#000000", 0)}
        title="Selection Tool"
      >
        <MousePointer2 size={18} />
      </Button>
      <Button
        variant={tool === "lasso" ? "secondary" : "ghost"}
        size="icon"
        className="h-9 w-9"
        onClick={() => handleToolSelect("lasso", "#000000", 0)}
        title="Lasso Tool"
      >
        <Lasso size={18} />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Eraser - Single button with dropdown when active */}
      <EraserButton />

      <div className="w-px h-6 bg-border mx-1" />

      {/* Markers (3) */}
      <ColorAndSizeButton
        color={marker1Color}
        width={marker1Width}
        onColorChange={(c) => {
          setMarker1Color(c);
          handleToolSelect("marker", c, marker1Width);
        }}
        onWidthChange={(w) => {
          setMarker1Width(w);
          handleToolSelect("marker", marker1Color, w);
        }}
        isActive={tool === "marker" && activeMarkerColor === marker1Color}
        onClick={() => handleToolSelect("marker", marker1Color, marker1Width)}
        icon={Pencil}
        label="Marker 1"
        minWidth={1}
        maxWidth={20}
      />
      <ColorAndSizeButton
        color={marker2Color}
        width={marker2Width}
        onColorChange={(c) => {
          setMarker2Color(c);
          handleToolSelect("marker", c, marker2Width);
        }}
        onWidthChange={(w) => {
          setMarker2Width(w);
          handleToolSelect("marker", marker2Color, w);
        }}
        isActive={tool === "marker" && activeMarkerColor === marker2Color}
        onClick={() => handleToolSelect("marker", marker2Color, marker2Width)}
        icon={Pencil}
        label="Marker 2"
        minWidth={1}
        maxWidth={20}
      />
      <ColorAndSizeButton
        color={marker3Color}
        width={marker3Width}
        onColorChange={(c) => {
          setMarker3Color(c);
          handleToolSelect("marker", c, marker3Width);
        }}
        onWidthChange={(w) => {
          setMarker3Width(w);
          handleToolSelect("marker", marker3Color, w);
        }}
        isActive={tool === "marker" && activeMarkerColor === marker3Color}
        onClick={() => handleToolSelect("marker", marker3Color, marker3Width)}
        icon={Pencil}
        label="Marker 3"
        minWidth={1}
        maxWidth={20}
      />

      <div className="w-px h-6 bg-border mx-1" />

      {/* Highlighter */}
      <ColorAndSizeButton
        color={highlighterColor}
        width={highlighterWidth}
        onColorChange={(c) => {
          setHighlighterColor(c);
          handleToolSelect("highlighter", c, highlighterWidth);
        }}
        onWidthChange={(w) => {
          setHighlighterWidth(w);
          handleToolSelect("highlighter", highlighterColor, w);
        }}
        isActive={tool === "highlighter"}
        onClick={() =>
          handleToolSelect("highlighter", highlighterColor, highlighterWidth)
        }
        icon={Highlighter}
        label="Highlighter"
        minWidth={10}
        maxWidth={40}
      />

      <div className="w-px h-6 bg-border mx-1" />

      {/* Fountain Pen */}
      <ColorAndSizeButton
        color={fountainPenColor}
        width={fountainPenWidth}
        onColorChange={(c) => {
          setFountainPenColor(c);
          handleToolSelect("fountain-pen", c, fountainPenWidth);
        }}
        onWidthChange={(w) => {
          setFountainPenWidth(w);
          handleToolSelect("fountain-pen", fountainPenColor, w);
        }}
        isActive={tool === "fountain-pen"}
        onClick={() =>
          handleToolSelect("fountain-pen", fountainPenColor, fountainPenWidth)
        }
        icon={PenTool}
        label="Fountain Pen"
        minWidth={1}
        maxWidth={8}
      />

      <div className="w-px h-6 bg-border mx-1" />

      {/* Text Tool */}
      <Button
        variant={tool === "text" ? "secondary" : "ghost"}
        size="icon"
        className="h-9 w-9"
        onClick={() => handleToolSelect("text", "#000000", 0)}
        title="Text Tool (T)"
      >
        <Type size={18} />
      </Button>
    </div>
  );
}
