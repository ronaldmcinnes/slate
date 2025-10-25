import { useState, useRef, useEffect } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { Button } from "@/components/ui/button";
import { Lasso } from "lucide-react";
import GraphDialog from "@/components/dialogs/GraphDialog";
import DraggableGraph from "./DraggableGraph";
import TextBox from "./TextBox";
import ToolbarDrawingTools from "./ToolbarDrawingTools";
import ToolbarActions from "./ToolbarActions";
import ToolbarSettings from "./ToolbarSettings";

export default function Canvas({ page, onUpdatePage }) {
  const [isRecording, setIsRecording] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [tool, setTool] = useState("marker");
  const [graphDialogOpen, setGraphDialogOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [toolbarScrollPosition, setToolbarScrollPosition] = useState(0);
  const [visibleTools, setVisibleTools] = useState({
    eraser: true,
    markers: true,
    highlighter: true,
    fountainPen: true,
    text: true,
    graph: true,
  });
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const titleInputRef = useRef(null);
  const toolbarScrollRef = useRef(null);

  const handleToggleTool = (toolId) => {
    setVisibleTools((prev) => ({
      ...prev,
      [toolId]: !prev[toolId],
    }));
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  const handleRedo = () => {
    canvasRef.current?.redo();
  };

  const handleToolChange = (newTool, color, width) => {
    setTool(newTool);
    setStrokeColor(color);
    setStrokeWidth(width);
  };

  // Focus input when editing title
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

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
    if (tool === "select") return "default";
    if (tool === "lasso") return "crosshair";
    if (tool === "eraser") return "default";
    return "crosshair";
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-background">
        {/* Canvas Area */}
        <div
          ref={canvasContainerRef}
          className="flex-1 relative bg-muted/30 overflow-auto"
          style={{ cursor: getCursorStyle() }}
        >
          {/* Floating Toolbar */}
          {isToolbarVisible ? (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg">
              <div className="flex items-center gap-2 px-2 py-2">
                {/* Static Tools - Always Visible */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Undo/Redo */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-muted"
                    onClick={handleUndo}
                    title="Undo (Ctrl+Z)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 7v6h6" />
                      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-muted"
                    onClick={handleRedo}
                    title="Redo (Ctrl+Y)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 7v6h-6" />
                      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                    </svg>
                  </Button>

                  <div className="w-px h-6 bg-border mx-1" />

                  {/* Selection Tools */}
                  <Button
                    variant={tool === "select" ? "secondary" : "ghost"}
                    size="icon"
                    className={`h-9 w-9 ${tool === "select" ? "bg-muted" : ""}`}
                    onClick={() => handleToolChange("select", "#000000", 0)}
                    title="Selection Tool"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                      <path d="M13 13l6 6" />
                    </svg>
                  </Button>
                  <Button
                    variant={tool === "lasso" ? "secondary" : "ghost"}
                    size="icon"
                    className={`h-9 w-9 ${tool === "lasso" ? "bg-muted" : ""}`}
                    onClick={() => handleToolChange("lasso", "#000000", 0)}
                    title="Lasso Tool"
                  >
                    <Lasso size={18} />
                  </Button>

                  {/* Recording */}
                  <Button
                    onClick={() => setIsRecording(!isRecording)}
                    variant={isRecording ? "destructive" : "ghost"}
                    size="icon"
                    className="h-9 w-9 hover:bg-muted"
                    title={isRecording ? "Stop Recording" : "Start Recording"}
                  >
                    {isRecording ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" x2="12" y1="2" y2="22" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                      </svg>
                    )}
                  </Button>
                </div>

                <div className="w-px h-8 bg-border flex-shrink-0" />

                {/* Left Scroll Arrow */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-7 hover:bg-muted flex-shrink-0"
                  onClick={() => {
                    if (toolbarScrollRef.current) {
                      // Scroll by approximately one tool width (9 * 4 for h-9 + gap)
                      toolbarScrollRef.current.scrollBy({
                        left: -52,
                        behavior: "smooth",
                      });
                    }
                  }}
                  title="Scroll Left"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </Button>

                {/* Scrollable Toolbar Content */}
                <div
                  ref={toolbarScrollRef}
                  className="flex items-center gap-3 overflow-x-auto scrollbar-hide max-w-[180px]"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                  onScroll={(e) =>
                    setToolbarScrollPosition(e.target.scrollLeft)
                  }
                >
                  <ToolbarDrawingTools
                    tool={tool}
                    onToolChange={handleToolChange}
                    visibleTools={visibleTools}
                  />

                  <div className="w-px h-8 bg-border flex-shrink-0" />

                  <ToolbarActions
                    onAddGraph={() => setGraphDialogOpen(true)}
                    visibleTools={visibleTools}
                  />
                </div>

                {/* Right Scroll Arrow */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-7 hover:bg-muted flex-shrink-0"
                  onClick={() => {
                    if (toolbarScrollRef.current) {
                      // Scroll by approximately one tool width (9 * 4 for h-9 + gap)
                      toolbarScrollRef.current.scrollBy({
                        left: 52,
                        behavior: "smooth",
                      });
                    }
                  }}
                  title="Scroll Right"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Button>

                <div className="w-px h-8 bg-border flex-shrink-0" />

                <ToolbarSettings
                  visibleTools={visibleTools}
                  onToggleTool={handleToggleTool}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-muted flex-shrink-0"
                  onClick={() => setIsToolbarVisible(false)}
                  title="Hide Toolbar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 h-10 w-10 rounded-full shadow-lg"
              onClick={() => setIsToolbarVisible(true)}
              title="Show Toolbar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </Button>
          )}
          {/* Page Title - Top Left */}
          <div className="absolute top-6 left-6 z-10 pointer-events-auto">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={() => {
                  if (tempTitle.trim()) {
                    onUpdatePage({ title: tempTitle.trim() });
                  }
                  setIsEditingTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (tempTitle.trim()) {
                      onUpdatePage({ title: tempTitle.trim() });
                    }
                    setIsEditingTitle(false);
                  } else if (e.key === "Escape") {
                    setIsEditingTitle(false);
                  }
                }}
                className="text-3xl font-bold text-foreground px-1 bg-background border-2 border-primary rounded focus:outline-none"
                autoFocus
              />
            ) : (
              <div>
                <h1
                  className="text-3xl font-bold text-foreground px-1 cursor-pointer hover:bg-muted/50 rounded transition-colors"
                  onDoubleClick={() => {
                    setTempTitle(page.title);
                    setIsEditingTitle(true);
                  }}
                >
                  {page.title}
                </h1>
                {page.createdAt && (
                  <p className="text-sm text-muted-foreground px-1 mt-1">
                    {new Date(page.createdAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    {new Date(page.createdAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                )}
              </div>
            )}
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
