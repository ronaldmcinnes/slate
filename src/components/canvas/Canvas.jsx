import { useState, useRef, useEffect } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import GraphDialog from "@/components/dialogs/GraphDialog";
import DraggableGraph from "./DraggableGraph";
import TextBox from "./TextBox";
import ToolbarDrawingTools from "./ToolbarDrawingTools";
import ToolbarActions from "./ToolbarActions";

export default function Canvas({ page, onUpdatePage }) {
  const [isRecording, setIsRecording] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [tool, setTool] = useState("marker");
  const [graphDialogOpen, setGraphDialogOpen] = useState(false);
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input/textarea
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Y - Redo
      else if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
      // T - Text tool
      else if (
        (e.key === "t" || e.key === "T") &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        handleToolChange("text", "#000000", 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle canvas click for text tool
  useEffect(() => {
    const handleCanvasClick = (e) => {
      if (tool === "text" && canvasContainerRef.current) {
        // Check if click is on the canvas area (not on other elements)
        if (
          e.target === canvasContainerRef.current ||
          e.target.closest(".canvas-clickable")
        ) {
          const rect = canvasContainerRef.current.getBoundingClientRect();
          const x =
            e.clientX - rect.left + canvasContainerRef.current.scrollLeft;
          const y = e.clientY - rect.top + canvasContainerRef.current.scrollTop;

          handleAddTextBoxAt(x, y);
        }
      }
    };

    const container = canvasContainerRef.current;
    if (container && tool === "text") {
      container.addEventListener("click", handleCanvasClick);
      return () => container.removeEventListener("click", handleCanvasClick);
    }
  }, [tool, page]);

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
    if (canvasRef.current) {
      const paths = await canvasRef.current.exportPaths();
      onUpdatePage({ drawings: paths });
    }
  };

  const handleToolChange = (newTool, color, width) => {
    setTool(newTool);
    setStrokeColor(color);
    setStrokeWidth(width);
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

  const handleUpdateGraphPosition = (graphId, x, y) => {
    const graphs = page.graphs.map((g) =>
      g.id === graphId ? { ...g, x, y } : g
    );
    onUpdatePage({ graphs });
  };

  const handleAddTextBoxAt = (x, y) => {
    const textBoxes = page.textBoxes || [];
    const newTextBox = {
      id: Date.now(),
      text: "",
      x: x - 100,
      y: y - 30,
    };
    textBoxes.push(newTextBox);
    onUpdatePage({ textBoxes });

    // Switch back to select tool after placing text
    setTool("select");
  };

  const handleRemoveTextBox = (textBoxId) => {
    const textBoxes = (page.textBoxes || []).filter((t) => t.id !== textBoxId);
    onUpdatePage({ textBoxes });
  };

  const handleUpdateTextBoxPosition = (textBoxId, x, y) => {
    const textBoxes = (page.textBoxes || []).map((t) =>
      t.id === textBoxId ? { ...t, x, y } : t
    );
    onUpdatePage({ textBoxes });
  };

  const handleUpdateTextBoxText = (textBoxId, text) => {
    const textBoxes = (page.textBoxes || []).map((t) =>
      t.id === textBoxId ? { ...t, text } : t
    );
    onUpdatePage({ textBoxes });
  };

  const handleGenerate = () => {
    // TODO: Implement AI generation
    console.log("Generate clicked");
  };

  // Determine if canvas should be interactive for drawing
  const isDrawingTool =
    tool !== "select" && tool !== "text" && tool !== "lasso";

  // Get cursor style based on tool
  const getCursorStyle = () => {
    if (tool === "text") return "text";
    if (tool === "select" || tool === "lasso") return "crosshair";
    if (tool === "eraser") return "default";
    return "crosshair";
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-background">
        {/* Toolbar */}
        <div className="border-b border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-4 py-2">
            <ToolbarDrawingTools
              tool={tool}
              strokeColor={strokeColor}
              strokeWidth={strokeWidth}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onToolChange={handleToolChange}
            />

            <ToolbarActions
              isRecording={isRecording}
              onToggleRecording={() => setIsRecording(!isRecording)}
              onAddGraph={() => setGraphDialogOpen(true)}
              onExport={handleExport}
              onGenerate={handleGenerate}
            />
          </div>
        </div>

        {/* Canvas Area */}
        <div
          ref={canvasContainerRef}
          className="flex-1 relative bg-muted/30 overflow-auto"
          style={{ cursor: getCursorStyle() }}
        >
          {/* Page Title - Top Left */}
          <div className="absolute top-6 left-6 z-10 pointer-events-auto">
            <h1 className="text-3xl font-bold text-foreground px-1">
              {page.title}
            </h1>
          </div>

          {/* Drawing Canvas */}
          <div
            className="canvas-clickable absolute inset-0"
            style={{ minWidth: "200%", minHeight: "200%" }}
          >
            <ReactSketchCanvas
              ref={canvasRef}
              strokeWidth={strokeWidth}
              strokeColor={tool === "eraser" ? "#FAFAFA" : strokeColor}
              eraserWidth={tool === "eraser" ? strokeWidth : 0}
              canvasColor="#FAFAFA"
              style={{
                width: "100%",
                height: "100%",
                pointerEvents: isDrawingTool ? "auto" : "none",
              }}
              svgStyle={{
                width: "100%",
                height: "100%",
              }}
              onChange={handleSaveDrawing}
            />
          </div>

          {/* Text Boxes Overlay */}
          {page.textBoxes && page.textBoxes.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="relative w-full h-full">
                {page.textBoxes.map((textBox) => (
                  <TextBox
                    key={textBox.id}
                    textBox={textBox}
                    onPositionChange={handleUpdateTextBoxPosition}
                    onTextChange={handleUpdateTextBoxText}
                    onRemove={handleRemoveTextBox}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Interactive Graphs Overlay */}
          {page.graphs && page.graphs.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="relative w-full h-full">
                {page.graphs.map((graph) => (
                  <DraggableGraph
                    key={graph.id}
                    graph={graph}
                    onPositionChange={handleUpdateGraphPosition}
                    onRemove={handleRemoveGraph}
                  />
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
