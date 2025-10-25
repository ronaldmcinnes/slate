import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

export default function ToolbarSettings({ visibleTools, onToggleTool }) {
  const [open, setOpen] = useState(false);

  const allTools = [
    { id: "eraser", label: "Eraser" },
    { id: "markers", label: "Markers" },
    { id: "highlighter", label: "Highlighter" },
    { id: "fountainPen", label: "Fountain Pen" },
    { id: "text", label: "Text Tool" },
    { id: "graph", label: "Add Graph" },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-muted flex-shrink-0"
          title="Customize Toolbar"
        >
          <Settings size={18} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3"
        side="bottom"
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div
          className="space-y-2"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-semibold text-sm mb-3">Customize Toolbar</h3>
          <div className="space-y-1">
            {allTools.map((tool) => (
              <label
                key={tool.id}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded cursor-pointer"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <input
                  type="checkbox"
                  checked={visibleTools[tool.id] !== false}
                  onChange={() => onToggleTool(tool.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                />
                <span className="text-sm">{tool.label}</span>
              </label>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
