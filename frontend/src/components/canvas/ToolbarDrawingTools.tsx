import {
  Eraser,
  Pencil,
  Highlighter,
  Type,
  ChevronDown,
  PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect, memo } from "react";
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

// Generate size presets based on min/max width
const getSizePresets = (minWidth: number, maxWidth: number) => {
  const range = maxWidth - minWidth;
  const step = Math.max(1, Math.floor(range / 4)); // 5 presets max
  const presets = [];

  for (let i = 0; i < 5; i++) {
    const size = minWidth + step * i;
    if (size <= maxWidth) {
      presets.push(size);
    }
  }

  // Always include max width if not already included
  if (!presets.includes(maxWidth)) {
    presets.push(maxWidth);
  }

  return presets;
};

interface ToolbarDrawingToolsProps {
  tool: string;
  onToolChange: (toolType: string, color: string, width: number) => void;
  visibleTools?: Record<string, boolean>;
}

export default function ToolbarDrawingTools({
  tool,
  onToolChange,
  visibleTools = {},
}: ToolbarDrawingToolsProps) {
  // Tool colors state - initialize based on current theme
  const getInitialColors = () => {
    const isDark =
      typeof window !== "undefined" &&
      document.documentElement.classList.contains("dark");
    return {
      marker1: isDark ? "#FFFFFF" : "#000000",
      marker2: "#EF4444",
      marker3: "#3B82F6",
      highlighter: "#FEF08A",
      fountainPen: isDark ? "#FFFFFF" : "#000000",
    };
  };

  const initialColors = getInitialColors();
  const [marker1Color, setMarker1Color] = useState(initialColors.marker1);
  const [marker2Color, setMarker2Color] = useState(initialColors.marker2);
  const [marker3Color, setMarker3Color] = useState(initialColors.marker3);
  const [highlighterColor, setHighlighterColor] = useState(
    initialColors.highlighter
  );
  const [fountainPenColor, setFountainPenColor] = useState(
    initialColors.fountainPen
  );

  // Update default colors when theme changes
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const isDark = root.classList.contains("dark");
      const defaultInk = isDark ? "#FFFFFF" : "#000000";

      // Only update if user hasn't customized the first marker
      setMarker1Color((prev) => {
        if (prev === "#000000" || prev === "#FFFFFF") {
          return defaultInk;
        }
        return prev;
      });

      setFountainPenColor((prev) => {
        if (prev === "#000000" || prev === "#FFFFFF") {
          return defaultInk;
        }
        return prev;
      });
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

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

  const handleToolSelect = (toolType: string, color: string, width: number) => {
    if (toolType === "marker") {
      setActiveMarkerColor(color);
    }
    onToolChange(toolType, color, width);
  };

  interface ColorAndSizeButtonProps {
    color: string;
    width: number;
    onColorChange: (color: string) => void;
    onWidthChange: (width: number) => void;
    isActive: boolean;
    onClick: () => void;
    icon: any;
    label: string;
    minWidth?: number;
    maxWidth?: number;
  }

  const ColorAndSizeButton = memo(
    ({
      color,
      width,
      onColorChange,
      onWidthChange,
      isActive,
      onClick,
      icon,
      label,
      minWidth = 1,
      maxWidth = 30,
    }: ColorAndSizeButtonProps) => {
      const [popoverOpen, setPopoverOpen] = useState(false);
      const IconComponent = icon;

      return (
        <div className="flex flex-col items-center">
          <Button
            variant={isActive ? "secondary" : "ghost"}
            size="icon"
            className={cn("h-9 w-9", isActive ? "rounded-b-none bg-muted" : "")}
            onClick={onClick}
            title={label}
          >
            <div className="relative">
              <IconComponent size={18} />
              <div
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
          </Button>
          {isActive && (
            <Popover
              open={popoverOpen}
              onOpenChange={setPopoverOpen}
              modal={false}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-3 w-9 rounded-t-none bg-muted py-0 flex items-center justify-center"
                  onClick={() => setPopoverOpen(!popoverOpen)}
                >
                  <ChevronDown size={10} />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-3"
                side="bottom"
                align="center"
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

                  {/* Size Presets */}
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-sm font-medium">Size</p>
                    <div className="flex gap-2">
                      {getSizePresets(minWidth, maxWidth).map((size) => (
                        <button
                          key={size}
                          className={cn(
                            "w-8 h-8 rounded border-2 flex items-center justify-center hover:scale-110 transition-transform",
                            width === size
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          )}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            onWidthChange(size);
                          }}
                          title={`${size}px`}
                        >
                          <div
                            className="rounded-full bg-current"
                            style={{
                              width: `${Math.max(2, (size / maxWidth) * 16)}px`,
                              height: `${Math.max(
                                2,
                                (size / maxWidth) * 16
                              )}px`,
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      );
    }
  );

  const EraserButton = memo(() => {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const isActive = tool === "eraser";

    return (
      <div className="flex flex-col items-center">
        <Button
          variant={isActive ? "secondary" : "ghost"}
          size="icon"
          className={cn("h-9 w-9", isActive ? "rounded-b-none bg-muted" : "")}
          onClick={() => handleToolSelect("eraser", "#FAFAFA", eraserWidth)}
          title="Eraser"
        >
          <Eraser size={18} />
        </Button>
        {isActive && (
          <Popover
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
            modal={false}
          >
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-3 w-9 rounded-t-none bg-muted py-0 flex items-center justify-center"
                onClick={() => setPopoverOpen(!popoverOpen)}
              >
                <ChevronDown size={10} />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-3"
              side="bottom"
              align="center"
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

                {/* Size Presets */}
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium">Size</p>
                  <div className="flex gap-2">
                    {getSizePresets(1, 40).map((size) => (
                      <button
                        key={size}
                        className={cn(
                          "w-8 h-8 rounded border-2 flex items-center justify-center hover:scale-110 transition-transform",
                          eraserWidth === size
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEraserWidth(size);
                          handleToolSelect("eraser", "#FAFAFA", size);
                        }}
                        title={`${size}px`}
                      >
                        <div
                          className="rounded-full bg-current"
                          style={{
                            width: `${Math.max(2, (size / 40) * 16)}px`,
                            height: `${Math.max(2, (size / 40) * 16)}px`,
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  });

  return (
    <div className="flex items-center gap-1">
      {/* Eraser - Single button with dropdown when active */}
      {visibleTools.eraser !== false && (
        <>
          <EraserButton />
          <div className="w-px h-6 bg-border mx-1" />
        </>
      )}

      {/* Markers (3) */}
      {visibleTools.markers !== false && (
        <>
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
            onClick={() =>
              handleToolSelect("marker", marker1Color, marker1Width)
            }
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
            onClick={() =>
              handleToolSelect("marker", marker2Color, marker2Width)
            }
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
            onClick={() =>
              handleToolSelect("marker", marker3Color, marker3Width)
            }
            icon={Pencil}
            label="Marker 3"
            minWidth={1}
            maxWidth={20}
          />
          <div className="w-px h-6 bg-border mx-1" />
        </>
      )}

      {/* Highlighter */}
      {visibleTools.highlighter !== false && (
        <>
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
              handleToolSelect(
                "highlighter",
                highlighterColor,
                highlighterWidth
              )
            }
            icon={Highlighter}
            label="Highlighter"
            minWidth={10}
            maxWidth={40}
          />
          <div className="w-px h-6 bg-border mx-1" />
        </>
      )}

      {/* Fountain Pen */}
      {visibleTools.fountainPen !== false && (
        <>
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
              handleToolSelect(
                "fountain-pen",
                fountainPenColor,
                fountainPenWidth
              )
            }
            icon={PenTool}
            label="Fountain Pen"
            minWidth={1}
            maxWidth={8}
          />
          <div className="w-px h-6 bg-border mx-1" />
        </>
      )}

      {/* Text Tool */}
      {visibleTools.text !== false && (
        <Button
          variant={tool === "text" ? "secondary" : "ghost"}
          size="icon"
          className={cn("h-9 w-9", tool === "text" ? "bg-muted" : "")}
          onClick={() => handleToolSelect("text", "#000000", 0)}
          title="Text Tool (T)"
        >
          <Type size={18} />
        </Button>
      )}
    </div>
  );
}
