import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface GraphDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddGraph: (graphData: any) => void;
}

export default function GraphDialog({ open, onOpenChange, onAddGraph }: GraphDialogProps) {
  const [title, setTitle] = useState("");
  const [graphType, setGraphType] = useState("function");
  const [equation, setEquation] = useState("x^2");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Random offset so graphs don't stack on top of each other
    const randomOffset = Math.floor(Math.random() * 200) + 150;

    let graphData: any = {
      title: title || "Graph",
      x: randomOffset,
      y: randomOffset,
      type: graphType,
      // Store the equation for potential future use
      equation: graphType === "function" ? equation : null,
    };

    onAddGraph(graphData);
    setTitle("");
    setEquation("x^2");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Add Interactive Graph</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                placeholder="Graph title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={graphType}
                onChange={(e) => setGraphType(e.target.value)}
              >
                <option value="function">Function Plot (f(x))</option>
                <option value="scatter">Scatter Plot</option>
                <option value="bar">Bar Chart</option>
              </select>
            </div>

            {graphType === "function" && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Equation (use x as variable)
                </label>
                <Input
                  placeholder="e.g., x^2, sin(x), x^3 - 2*x"
                  value={equation}
                  onChange={(e) => setEquation(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use ^ for power, * for multiply. Examples: x^2, 2*x + 3,
                  Math.sin(x)
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Graph</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
