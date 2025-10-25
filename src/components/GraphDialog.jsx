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

export default function GraphDialog({ open, onOpenChange, onAddGraph }) {
  const [title, setTitle] = useState("");
  const [graphType, setGraphType] = useState("function");
  const [equation, setEquation] = useState("x^2");

  const handleSubmit = (e) => {
    e.preventDefault();

    let graphData = {
      title: title || "Graph",
      x: "20%",
      y: "20%",
    };

    // Generate data based on type
    if (graphType === "function") {
      // Simple function plot
      const xValues = [];
      const yValues = [];
      for (let x = -10; x <= 10; x += 0.1) {
        xValues.push(x);
        try {
          // Simple evaluation (in production, use a proper math parser)
          const y = eval(equation.replace(/x/g, `(${x})`).replace(/\^/g, "**"));
          yValues.push(y);
        } catch {
          yValues.push(null);
        }
      }
      graphData.data = [
        {
          x: xValues,
          y: yValues,
          type: "scatter",
          mode: "lines",
          line: { color: "#000" },
        },
      ];
      graphData.layout = {
        xaxis: { title: "x", zeroline: true },
        yaxis: { title: "y", zeroline: true },
      };
    } else if (graphType === "scatter") {
      // Sample scatter plot
      const x = Array.from({ length: 20 }, () => Math.random() * 10);
      const y = Array.from({ length: 20 }, () => Math.random() * 10);
      graphData.data = [
        {
          x,
          y,
          type: "scatter",
          mode: "markers",
          marker: { size: 8 },
        },
      ];
      graphData.layout = {
        xaxis: { title: "x" },
        yaxis: { title: "y" },
      };
    } else if (graphType === "bar") {
      // Sample bar chart
      graphData.data = [
        {
          x: ["A", "B", "C", "D", "E"],
          y: [20, 14, 23, 25, 18],
          type: "bar",
        },
      ];
      graphData.layout = {
        xaxis: { title: "Category" },
        yaxis: { title: "Value" },
      };
    }

    onAddGraph(graphData);
    setTitle("");
    setEquation("x^2");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
