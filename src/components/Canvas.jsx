import {
  Mic,
  MicOff,
  Sparkles,
  Eraser,
  Pencil,
  Undo,
  Redo,
  Download,
  LineChart,
} from "lucide-react";
import { useState, useRef } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import Plot from "react-plotly.js";
import { Button } from "@/components/ui/button";
import GraphDialog from "./GraphDialog";

export default function Canvas({ page, onUpdatePage }) {
  const [isRecording, setIsRecording] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [eraseMode, setEraseMode] = useState(false);
  const [graphDialogOpen, setGraphDialogOpen] = useState(false);
  const canvasRef = useRef(null);

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📓</div>
          <h3 className="text-xl font-medium text-foreground mb-2">
            No page selected
          </h3>
          <p className="text-sm text-muted-foreground">
            Select a page from your notebook to start drawing
          </p>
        </div>
      </div>
    );
  }

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  const handleRedo = () => {
    canvasRef.current?.redo();
  };

  const handleClear = () => {
    if (confirm("Clear all drawings? This cannot be undone.")) {
      canvasRef.current?.clearCanvas();
    }
  };

  const handleExport = async () => {
    const image = await canvasRef.current?.exportImage("png");
    if (image) {
      const link = document.createElement("a");
      link.download = `${page.title}.png`;
      link.href = image;
      link.click();
    }
  };

  const handleSaveDrawing = async () => {
    const paths = await canvasRef.current?.exportPaths();
    onUpdatePage({ drawings: paths });
  };

  const handleAddGraph = (graphData) => {
    const graphs = page.graphs || [];
    graphs.push({
      id: Date.now(),
      ...graphData,
    });
    onUpdatePage({ graphs });
  };

  const handleRemoveGraph = (graphId) => {
    const graphs = (page.graphs || []).filter((g) => g.id !== graphId);
    onUpdatePage({ graphs });
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-background">
        {/* Toolbar */}
        <div className="border-b border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {page.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(page.lastModified).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Drawing Tools */}
              <div className="flex items-center gap-1 mr-4 border-r pr-4">
                <Button
                  variant={!eraseMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEraseMode(false)}
                  title="Draw"
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant={eraseMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEraseMode(true)}
                  title="Erase"
                >
                  <Eraser size={16} />
                </Button>

                <div className="flex items-center gap-2 ml-2">
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-border"
                    disabled={eraseMode}
                    title="Stroke color"
                  />
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-24"
                    disabled={eraseMode}
                    title="Stroke width"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  title="Undo"
                >
                  <Undo size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  title="Redo"
                >
                  <Redo size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  title="Export as PNG"
                >
                  <Download size={16} />
                </Button>
              </div>

              {/* Graph Tools */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGraphDialogOpen(true)}
                title="Add graph"
              >
                <LineChart size={16} />
                Add Graph
              </Button>

              {/* Voice Controls */}
              <Button
                onClick={() => setIsRecording(!isRecording)}
                variant={isRecording ? "destructive" : "default"}
                size="sm"
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                {isRecording ? "Stop" : "Record"}
              </Button>

              <Button variant="outline" size="sm">
                <Sparkles size={16} />
                Generate
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas Area with Graphs Overlay */}
        <div className="flex-1 relative bg-muted/30 overflow-auto">
          {/* Drawing Canvas */}
          <div className="absolute inset-0">
            <ReactSketchCanvas
              ref={canvasRef}
              strokeWidth={strokeWidth}
              strokeColor={eraseMode ? "#FAFAFA" : strokeColor}
              canvasColor="#FAFAFA"
              style={{
                width: "100%",
                height: "100%",
              }}
              svgStyle={{
                width: "100%",
                height: "100%",
              }}
              onChange={handleSaveDrawing}
            />
          </div>

          {/* Interactive Graphs Overlay */}
          {page.graphs && page.graphs.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="relative w-full h-full">
                {page.graphs.map((graph) => (
                  <div
                    key={graph.id}
                    className="absolute pointer-events-auto"
                    style={{
                      left: graph.x || "10%",
                      top: graph.y || "10%",
                    }}
                  >
                    <div className="bg-card border-2 border-border rounded-lg shadow-lg overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
                        <span className="text-xs font-medium">
                          {graph.title}
                        </span>
                        <button
                          onClick={() => handleRemoveGraph(graph.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <span className="text-xs">×</span>
                        </button>
                      </div>
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
                ))}
              </div>
            </div>
          )}

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse z-50">
              <div className="w-2 h-2 bg-destructive-foreground rounded-full"></div>
              <span className="text-sm font-medium">Recording...</span>
            </div>
          )}
        </div>
      </div>

      <GraphDialog
        open={graphDialogOpen}
        onOpenChange={setGraphDialogOpen}
        onAddGraph={handleAddGraph}
      />
    </>
  );
}
