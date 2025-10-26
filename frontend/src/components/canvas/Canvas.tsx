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
import { AudioRecordingService } from "@/lib/audioService";
import type { Page } from "@/types";

interface CanvasProps {
  page: Page | null;
  onUpdatePage: (updates: Partial<Page>) => void;
  permission?: "view" | "edit";
}

export default function Canvas({
  page,
  onUpdatePage,
  permission = "edit",
}: CanvasProps) {
  const isReadOnly = permission === "view";
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [error, setError] = useState("");
  // Initialize stroke color based on current theme
  const getInitialStrokeColor = () => {
    return typeof window !== "undefined" &&
      document.documentElement.classList.contains("dark")
      ? "#FFFFFF"
      : "#000000";
  };
  const [strokeColor, setStrokeColor] = useState(getInitialStrokeColor());
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [tool, setTool] = useState("marker");
  const [graphDialogOpen, setGraphDialogOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [toolbarScrollPosition, setToolbarScrollPosition] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 200, height: 200 });
  const [visibleTools, setVisibleTools] = useState({
    eraser: true,
    markers: true,
    highlighter: true,
    fountainPen: true,
    text: true,
    graph: true,
    microphone: true,
  });
  const canvasRef = useRef<any>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const toolbarScrollRef = useRef<HTMLDivElement>(null);
  const audioService = useRef(new AudioRecordingService());
  const saveDrawingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleToggleTool = (toolId: keyof typeof visibleTools) => {
    setVisibleTools((prev) => ({
      ...prev,
      [toolId]: !prev[toolId],
    }));
  };

  // Auto-expand canvas when scrolling near edges (videogame exploration style)
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const {
        scrollTop,
        scrollLeft,
        scrollHeight,
        scrollWidth,
        clientHeight,
        clientWidth,
      } = container;

      const expandThreshold = 300; // pixels from edge to trigger expansion
      let needsExpansion = false;
      let newSize = { ...canvasSize };

      // Check if scrolled near bottom edge
      if (scrollHeight - (scrollTop + clientHeight) < expandThreshold) {
        newSize.height = canvasSize.height + 50;
        needsExpansion = true;
      }

      // Check if scrolled near right edge
      if (scrollWidth - (scrollLeft + clientWidth) < expandThreshold) {
        newSize.width = canvasSize.width + 50;
        needsExpansion = true;
      }

      if (needsExpansion) {
        setCanvasSize(newSize);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [canvasSize]);

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  const handleRedo = () => {
    canvasRef.current?.redo();
  };

  const handleToolChange = (newTool: string, color: string, width: number) => {
    setTool(newTool);
    setStrokeColor(color);
    setStrokeWidth(width);
  };

  // When theme toggles, flip default ink color if user hasn't customized away from default
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const isDark = root.classList.contains("dark");
      setStrokeColor((current) => {
        if (isDark && current === "#000000") return "#FFFFFF";
        if (!isDark && current === "#FFFFFF") return "#000000";
        return current;
      });
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Force canvas re-render when theme changes to prevent flicker
  const [canvasKey, setCanvasKey] = useState(0);
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setCanvasKey((prev) => prev + 1);
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Focus input when editing title
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      const input = titleInputRef.current;
      // Use requestAnimationFrame to avoid blocking
      requestAnimationFrame(() => {
        input.focus();
        // Position cursor at end of text
        input.setSelectionRange(input.value.length, input.value.length);
      });
    }
  }, [isEditingTitle]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        (e.target && (e.target as HTMLElement).tagName === "INPUT") ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      ) {
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
      // Ctrl+S - Save
      else if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleManualSave();
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
    const handleCanvasClick = (e: MouseEvent) => {
      if (tool === "text" && canvasContainerRef.current) {
        // Check if click is on the canvas area (not on other elements)
        if (
          e.target === canvasContainerRef.current ||
          (e.target as HTMLElement)?.closest(".canvas-clickable")
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

  const handleExport = async () => {
    if (!page) return;
    
    const image = await canvasRef.current?.exportImage("png");
    if (image) {
      const link = document.createElement("a");
      link.download = `${page.title}.png`;
      link.href = image;
      link.click();
    }
  };

  const handleSaveDrawing = async () => {
    if (!canvasRef.current || isReadOnly) return;

    // Mark that drawing changes have been made
    markAsChanged();
  };

  // Load and restore page content when page changes
  useEffect(() => {
    if (!page || !canvasRef.current) return;

    const loadPageContent = async () => {
      try {
        console.log("Loading page content for page:", page.id);
        console.log("Page drawings:", page.drawings);
        console.log("Page textBoxes:", page.textBoxes);
        console.log("Page graphs:", page.graphs);
        
        // Restore drawings if they exist
        if (page.drawings && page.drawings.paths && page.drawings.paths.length > 0) {
          console.log("Loading drawing paths:", page.drawings.paths);
          await canvasRef.current.loadPaths(page.drawings.paths);
          console.log("Drawing paths loaded successfully");
        } else if (page.drawings && Array.isArray(page.drawings) && page.drawings.length > 0) {
          // Handle case where drawings is stored as array directly
          console.log("Loading drawing paths (direct array):", page.drawings);
          await canvasRef.current.loadPaths(page.drawings);
          console.log("Drawing paths loaded successfully");
        } else {
          console.log("No drawings to load, clearing canvas");
          // Clear canvas if no drawings
          await canvasRef.current.clearCanvas();
        }
      } catch (error) {
        console.error("Failed to load page content:", error);
      }
    };

    loadPageContent();
  }, [page?.id]); // Only reload when page ID changes

  // Mark that changes have been made
  const markAsChanged = () => {
    setHasUnsavedChanges(true);
  };

  // Removed auto-save to prevent state conflicts and blinking
  // Saves will now only happen on manual button press or specific user actions

  const handleAddGraph = (graphData: any) => {
    if (!page) return;
    
    const graphs = page.graphs || [];
    const newGraph = {
      id: Date.now().toString(),
      type: graphData.type || "mathematical",
      data: graphData,
      layout: {},
      position: { x: graphData.x || 100, y: graphData.y || 100 },
      size: { width: 500, height: 400 },
      graphSpec: graphData,
    };
    graphs.push(newGraph);
    onUpdatePage({ graphs });
    markAsChanged();
  };

  // Manual save function for immediate saving
  const handleManualSave = async () => {
    if (!page || isReadOnly) return;
    
    try {
      await savePageState();
      console.log("Manual save completed");
    } catch (error) {
      console.error("Failed to save page:", error);
    }
  };

  const handleRemoveGraph = (graphId: string) => {
    if (!page) return;
    
    const graphs = (page.graphs || []).filter((g) => g.id !== graphId);
    onUpdatePage({ graphs });
    markAsChanged();
  };

  const handleUpdateGraphPosition = (graphId: string, x: number, y: number) => {
    if (!page) return;
    
    const graphs = page.graphs.map((g) =>
      g.id === graphId ? { ...g, position: { x, y } } : g
    );
    onUpdatePage({ graphs });
    markAsChanged();
  };

  const handleUpdateGraph = (graphId: string, newGraphSpec: any) => {
    if (!page) return;
    
    const graphs = page.graphs.map((g) =>
      g.id === graphId
        ? { ...g, graphSpec: newGraphSpec, data: newGraphSpec }
        : g
    );
    onUpdatePage({ graphs });
    markAsChanged();
  };

  const handleSizeChange = (graphId: string, width: number, height: number) => {
    if (!page) return;
    
    const graphs = page.graphs.map((g) =>
      g.id === graphId ? { ...g, size: { width, height } } : g
    );
    onUpdatePage({ graphs });
    markAsChanged();
  };

  const handleAddTextBoxAt = (x: number, y: number) => {
    if (!page) return;
    
    const textBoxes = page.textBoxes || [];
    const newTextBox = {
      id: Date.now().toString(),
      text: "",
      position: { x: x - 100, y: y - 30 },
      size: { width: 200, height: 60 },
      fontSize: 16,
      fontFamily: "Arial",
      color: "#000000",
    };
    textBoxes.push(newTextBox);
    onUpdatePage({ textBoxes });
    markAsChanged();

    // Switch back to select tool after placing text
    setTool("select");
  };

  const handleRemoveTextBox = (textBoxId: string) => {
    if (!page) return;
    
    const textBoxes = (page.textBoxes || []).filter((t) => t.id !== textBoxId);
    onUpdatePage({ textBoxes });
    markAsChanged();
  };

  const handleUpdateTextBoxPosition = (
    textBoxId: string,
    x: number,
    y: number
  ) => {
    if (!page) return;
    
    const textBoxes = (page.textBoxes || []).map((t) =>
      t.id === textBoxId ? { ...t, position: { x, y } } : t
    );
    onUpdatePage({ textBoxes });
    markAsChanged();
  };

  const handleUpdateTextBoxText = (textBoxId: string, text: string) => {
    if (!page) return;
    
    const textBoxes = (page.textBoxes || []).map((t) =>
      t.id === textBoxId ? { ...t, text } : t
    );
    onUpdatePage({ textBoxes });
    markAsChanged();
  };

  // Save complete page state when manually triggered
  const savePageState = async () => {
    if (!page || isReadOnly) {
      console.log("Cannot save: no page or read-only mode");
      return;
    }

    try {
      setIsSaving(true);
      console.log("Starting to save page state...");
      
      // Get current drawing paths
      const paths = canvasRef.current ? await canvasRef.current.exportPaths() : null;
      console.log("Drawing paths:", paths);
      
      // Prepare the complete page state with proper drawing data structure
      const pageState = {
        drawings: paths ? { paths } : null,
        textBoxes: page.textBoxes || [],
        graphs: page.graphs || [],
      };

      console.log("Saving page state:", pageState);
      console.log("Text boxes with positions:", pageState.textBoxes.map(tb => ({ id: tb.id, position: tb.position })));
      console.log("Graphs with positions:", pageState.graphs.map(g => ({ id: g.id, position: g.position })));

      // Save to database
      await onUpdatePage(pageState);
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      console.log("Page saved successfully to database");
      
      // Hide success message after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Failed to save page state:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = () => {
    // TODO: Implement AI generation
  };

  const handleStartRecording = async () => {
    try {
      setError("");
      await audioService.current.startRecording();
      setIsRecording(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start recording"
      );
    }
  };

  const handleStopRecording = async () => {
    try {
      const audioBlob = await audioService.current.stopRecording();
      setIsRecording(false);
      setIsTranscribing(true);

      const transcriptionText = await audioService.current.transcribeAudio(
        audioBlob
      );
      setTranscription(transcriptionText);
      setIsTranscribing(false);

      setIsInterpreting(true);
      const graphSpec = await audioService.current.interpretTranscription(
        transcriptionText
      );
      setIsInterpreting(false);

      const graphs = page?.graphs || [];
      const newGraph = {
        id: Date.now().toString(),
        type: "threejs",
        data: graphSpec,
        layout: {},
        position: { x: 100, y: 100 },
        size: { width: 500, height: 400 },
        graphSpec: graphSpec,
      };
      graphs.push(newGraph);
      onUpdatePage({ graphs });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recording failed");
      setIsRecording(false);
      setIsTranscribing(false);
      setIsInterpreting(false);
    }
  };

  // Adapter functions to convert between main types and component interfaces
  const convertTextBoxForComponent = (textBox: any) => ({
    id: textBox.id,
    x: textBox.position?.x || textBox.x || 100,
    y: textBox.position?.y || textBox.y || 100,
    text: textBox.text || "",
  });

  const convertGraphForComponent = (graph: any) => {
    return {
      id: graph.id,
      x: graph.position?.x || graph.x || 100,
      y: graph.position?.y || graph.y || 100,
      title: graph.graphSpec?.plot?.title || graph.title || "Graph",
      data: graph.data || [],
      layout: graph.layout || {},
      graphSpec: graph.graphSpec,
      size: graph.size || { width: 500, height: 400 },
    };
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

  // Early return for no page selected - must be after all hooks
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

  return (
    <>
      <div className="flex-1 flex flex-col bg-background">
        {/* Canvas Area */}
        <div
          ref={canvasContainerRef}
          className="flex-1 relative bg-muted/30 dark:bg-neutral-900 overflow-auto scrollbar-hide"
          style={{ cursor: getCursorStyle() }}
        >
          {/* Floating Toolbar */}
          {isToolbarVisible ? (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg">
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

                  {/* Save Button */}
                  <Button
                    variant={hasUnsavedChanges ? "default" : "ghost"}
                    size="icon"
                    className={`h-9 w-9 ${hasUnsavedChanges ? "bg-blue-500 hover:bg-blue-600 text-white" : "hover:bg-muted"}`}
                    onClick={handleManualSave}
                    title={hasUnsavedChanges ? "Save Page (Ctrl+S) - Unsaved Changes" : "Save Page (Ctrl+S)"}
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
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17,21 17,13 7,13 7,21" />
                      <polyline points="7,3 7,8 15,8" />
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

                  {/* Audio Recording */}
                  <Button
                    onMouseDown={handleStartRecording}
                    onMouseUp={handleStopRecording}
                    onTouchStart={handleStartRecording}
                    onTouchEnd={handleStopRecording}
                    variant={isRecording ? "destructive" : "ghost"}
                    size="icon"
                    className={`h-9 w-9 hover:bg-muted ${
                      isTranscribing || isInterpreting
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={isTranscribing || isInterpreting}
                    title={
                      isTranscribing
                        ? "Transcribing..."
                        : isInterpreting
                        ? "Interpreting..."
                        : isRecording
                        ? "Release to stop recording"
                        : "Hold to record audio"
                    }
                  >
                    {isTranscribing || isInterpreting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : isRecording ? (
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
                    setToolbarScrollPosition(
                      (e.target as HTMLDivElement).scrollLeft
                    )
                  }
                >
                  {!isReadOnly && (
                    <>
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
                    </>
                  )}
                  {isReadOnly && (
                    <div className="text-sm text-orange-600 font-medium px-3">
                      View Only - Editing Disabled
                    </div>
                  )}
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
                  onToggleTool={(toolId: string) =>
                    handleToggleTool(toolId as keyof typeof visibleTools)
                  }
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
            <div>
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
                  className="m-0 text-3xl font-bold text-foreground bg-transparent outline-none"
                  autoComplete="off"
                  autoFocus
                />
              ) : (
                <h1
                  onClick={() => {
                    if (!isReadOnly) {
                      setTempTitle(page.title);
                      setIsEditingTitle(true);
                    }
                  }}
                  className={`m-0 text-3xl font-bold text-foreground ${
                    isReadOnly ? "" : "cursor-text"
                  }`}
                >
                  {tempTitle || page.title}
                </h1>
              )}
              {page.createdAt && (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">
                    {new Date(page.createdAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  {hasUnsavedChanges && (
                    <span className="text-xs text-orange-500 font-medium">
                      • Unsaved changes
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Drawing Canvas */}
          <div
            className="canvas-clickable absolute inset-0"
            style={{
              minWidth: `${canvasSize.width}%`,
              minHeight: `${canvasSize.height}%`,
            }}
          >
            <ReactSketchCanvas
              key={canvasKey}
              ref={canvasRef}
              strokeWidth={strokeWidth}
              strokeColor={
                tool === "eraser"
                  ? document.documentElement.classList.contains("dark")
                    ? "#111111"
                    : "#FAFAFA"
                  : strokeColor
              }
              eraserWidth={tool === "eraser" ? strokeWidth : 0}
              canvasColor={
                document.documentElement.classList.contains("dark")
                  ? "#111111"
                  : "#FAFAFA"
              }
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
                {page.textBoxes.map(
                  (textBox) =>
                    textBox && (
                      <TextBox
                        key={textBox.id}
                        textBox={convertTextBoxForComponent(textBox)}
                        onPositionChange={handleUpdateTextBoxPosition}
                        onTextChange={handleUpdateTextBoxText}
                        onRemove={handleRemoveTextBox}
                      />
                    )
                )}
              </div>
            </div>
          )}

          {/* Interactive Graphs Overlay */}
          {page.graphs && page.graphs.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="relative w-full h-full">
                {page.graphs.map(
                  (graph) =>
                    graph && (
                      <DraggableGraph
                        key={graph.id}
                        graph={convertGraphForComponent(graph)}
                        onPositionChange={handleUpdateGraphPosition}
                        onRemove={handleRemoveGraph}
                        onUpdateGraph={handleUpdateGraph}
                        onSizeChange={handleSizeChange}
                      />
                    )
                )}
              </div>
            </div>
          )}

          {/* Status Indicators */}
          {isRecording && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse z-50">
              <div className="w-2 h-2 bg-destructive-foreground rounded-full"></div>
              <span className="text-sm font-medium">Recording...</span>
            </div>
          )}

          {isSaving && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="text-sm font-medium">Saving...</span>
            </div>
          )}

          {saveSuccess && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
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
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span className="text-sm font-medium">Saved!</span>
            </div>
          )}

          {isTranscribing && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="text-sm font-medium">Transcribing...</span>
            </div>
          )}

          {isInterpreting && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="text-sm font-medium">Interpreting...</span>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md z-50">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                  <button
                    onClick={() => setError("")}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Transcription Result */}
          {transcription && (
            <div className="absolute top-20 right-6 bg-green-50 border border-green-200 rounded-lg p-4 max-w-md z-50">
              <h3 className="text-sm font-medium text-green-800 mb-2">
                Transcription:
              </h3>
              <p className="text-green-700 text-sm">{transcription}</p>
              <button
                onClick={() => setTranscription("")}
                className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
              >
                Dismiss
              </button>
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
