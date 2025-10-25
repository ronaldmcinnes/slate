import { useState, useRef } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import GraphDialog from "@/components/dialogs/GraphDialog";
import DraggableGraph from "./DraggableGraph";
import TextBox from "./TextBox";
import ToolbarDrawingTools from "./ToolbarDrawingTools";
import ToolbarActions from "./ToolbarActions";

export default function Canvas({ page, onUpdatePage }) {
  const [isRecording, setIsRecording] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [tool, setTool] = useState("pen");
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

  const handleAddTextBox = () => {
    const textBoxes = page.textBoxes || [];
    const randomOffset = Math.floor(Math.random() * 200) + 150;
    const newTextBox = {
      id: Date.now(),
      text: "",
      x: randomOffset,
      y: randomOffset,
    };
    textBoxes.push(newTextBox);
    onUpdatePage({ textBoxes });
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

  return (
    <>
      <div className="flex-1 flex flex-col bg-background">
        {/* Toolbar */}
        <div className="border-b border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-4 py-2">
            <ToolbarDrawingTools
              tool={tool}
              strokeColor={strokeColor}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onToolChange={handleToolChange}
            />

            <ToolbarActions
              isRecording={isRecording}
              onToggleRecording={() => setIsRecording(!isRecording)}
              onAddTextBox={handleAddTextBox}
              onAddGraph={() => setGraphDialogOpen(true)}
              onExport={handleExport}
              onGenerate={handleGenerate}
            />
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-muted/30 overflow-auto">
          {/* Page Title - Top Left */}
          <div className="absolute top-6 left-6 z-10 pointer-events-auto">
            <h1 className="text-3xl font-bold text-foreground px-1">
              {page.title}
            </h1>
          </div>

          {/* Drawing Canvas */}
          <div
            className="absolute inset-0"
            style={{ minWidth: "200%", minHeight: "200%" }}
          >
            <ReactSketchCanvas
              ref={canvasRef}
              strokeWidth={strokeWidth}
              strokeColor={tool === "eraser" ? "#FAFAFA" : strokeColor}
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
