import { useEffect, useState } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import GraphDialog from "@/components/dialogs/GraphDialog";
import CanvasToolbar from "./CanvasToolbar";
import CanvasTitle from "./CanvasTitle";
import CanvasOverlays from "./CanvasOverlays";
import CanvasContainer from "@/components/layout/CanvasContainer";
import NoPageSelected from "@/components/common/NoPageSelected";
import SaveButton from "@/components/features/save/SaveButton";
import SaveStatus from "@/components/features/save/SaveStatus";
import AudioRecordingButton from "@/components/features/audio/AudioRecordingButton";
import AudioStatus from "@/components/features/audio/AudioStatus";
import { useCanvas } from "@/hooks/useCanvas";
import { useCanvasSave } from "@/hooks/useCanvasSave";
import { useCanvasTools } from "@/hooks/useCanvasTools";
import { useCanvasAudio } from "@/hooks/useCanvasAudio";
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
  const [graphDialogOpen, setGraphDialogOpen] = useState(false);

  // Main canvas hook
  const { state, actions, refs, setters } = useCanvas(page, onUpdatePage);

  // Save functionality
  const { savePageState } = useCanvasSave({
    page,
    isReadOnly,
    canvasRef: refs.canvasRef,
    onUpdatePage,
    setIsSaving: setters.setIsSaving,
    setHasUnsavedChanges: setters.setHasUnsavedChanges,
    setSaveSuccess: setters.setSaveSuccess,
    setError: setters.setError,
  });

  // Tools functionality
  const {
    handleToolChange,
    handleAddGraph,
    handleRemoveGraph,
    handleUpdateGraphPosition,
    handleUpdateGraph,
    handleCameraChange,
    handleSizeChange,
    handleAddTextBoxAt,
    handleRemoveTextBox,
    handleUpdateTextBoxPosition,
    handleUpdateTextBoxText,
  } = useCanvasTools({
    page,
    onUpdatePage,
    markAsChanged: actions.markAsChanged,
    setTool: actions.setTool,
    setStrokeColor: actions.setStrokeColor,
    setStrokeWidth: actions.setStrokeWidth,
  });

  // Audio functionality
  const { handleStartRecording, handleStopRecording } = useCanvasAudio({
    page,
    onUpdatePage,
    audioService: refs.audioService,
    setIsRecording: setters.setIsRecording,
    setIsTranscribing: setters.setIsTranscribing,
    setIsInterpreting: setters.setIsInterpreting,
    setTranscription: setters.setTranscription,
    setError: setters.setError,
  });

  // Canvas operations
  const handleUndo = () => {
    refs.canvasRef.current?.undo();
  };

  const handleRedo = () => {
    refs.canvasRef.current?.redo();
  };

  const handleClearCanvas = async () => {
    if (!refs.canvasRef.current) return;

    try {
      await refs.canvasRef.current.clearCanvas();
      actions.markAsChanged();
      console.log("Canvas cleared successfully");
    } catch (error) {
      console.error("Failed to clear canvas:", error);
    }
  };

  const handleSaveDrawing = async () => {
    if (!refs.canvasRef.current || isReadOnly) return;
    actions.markAsChanged();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable all shortcuts in view-only mode
      if (isReadOnly) return;

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
        savePageState();
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
  }, [savePageState, handleToolChange, isReadOnly]);

  // Handle canvas click for text tool
  useEffect(() => {
    const handleCanvasClick = (e: MouseEvent) => {
      if (isReadOnly) return; // Disable text tool in view-only mode
      if (state.tool === "text" && refs.canvasContainerRef.current) {
        // Check if click is on the canvas area (not on other elements)
        if (
          e.target === refs.canvasContainerRef.current ||
          (e.target as HTMLElement)?.closest(".canvas-clickable")
        ) {
          const rect = refs.canvasContainerRef.current.getBoundingClientRect();
          const x =
            e.clientX - rect.left + refs.canvasContainerRef.current.scrollLeft;
          const y =
            e.clientY - rect.top + refs.canvasContainerRef.current.scrollTop;

          handleAddTextBoxAt(x, y);
        }
      }
    };

    const container = refs.canvasContainerRef.current;
    if (container && state.tool === "text" && !isReadOnly) {
      container.addEventListener("click", handleCanvasClick);
      return () => container.removeEventListener("click", handleCanvasClick);
    }
  }, [state.tool, page, handleAddTextBoxAt, isReadOnly]);

  // Load and restore page content when page changes
  useEffect(() => {
    if (!page || !refs.canvasRef.current) return;

    const loadPageContent = async () => {
      try {
        console.log("Loading page content for page:", page.id);
        console.log("Page drawings:", page.drawings);
        console.log("Page textBoxes:", page.textBoxes);
        console.log("Page graphs:", page.graphs);

        // Restore drawings if they exist
        if (
          page.drawings &&
          page.drawings.paths &&
          page.drawings.paths.length > 0
        ) {
          console.log("Loading drawing paths:", page.drawings.paths);
          await refs.canvasRef.current.loadPaths(page.drawings.paths);
          console.log("Drawing paths loaded successfully");
        } else if (
          page.drawings &&
          Array.isArray(page.drawings) &&
          page.drawings.length > 0
        ) {
          // Handle case where drawings is stored as array directly
          console.log("Loading drawing paths (direct array):", page.drawings);
          await refs.canvasRef.current.loadPaths(page.drawings);
          console.log("Drawing paths loaded successfully");
        } else {
          console.log("No drawings to load, clearing canvas");
          // Clear canvas if no drawings
          await refs.canvasRef.current.clearCanvas();
        }
      } catch (error) {
        console.error("Failed to load page content:", error);
      }
    };

    loadPageContent();
  }, [page?.id]);

  // Focus input when editing title
  useEffect(() => {
    if (state.isEditingTitle && refs.titleInputRef.current) {
      const input = refs.titleInputRef.current;
      // Use requestAnimationFrame to avoid blocking
      requestAnimationFrame(() => {
        input.focus();
        // Position cursor at end of text
        input.setSelectionRange(input.value.length, input.value.length);
      });
    }
  }, [state.isEditingTitle]);

  // Determine if canvas should be interactive for drawing
  const isDrawingTool =
    state.tool !== "select" && state.tool !== "text" && state.tool !== "lasso";

  // Get cursor style based on tool
  const getCursorStyle = () => {
    // For view-only users, always show hand cursor to indicate panning/scrolling
    if (isReadOnly) return "grab";

    if (state.tool === "text") return "text";
    if (state.tool === "select") return "default";
    if (state.tool === "lasso") return "crosshair";
    if (state.tool === "eraser") return "default";
    return "crosshair";
  };

  // Early return for no page selected
  if (!page) {
    return <NoPageSelected />;
  }

  return (
    <>
      <div className="flex-1 flex flex-col bg-background">
        {/* Canvas Area */}
        <CanvasContainer
          canvasSize={state.canvasSize}
          onCanvasSizeChange={actions.setCanvasSize}
          cursorStyle={getCursorStyle()}
          canvasContainerRef={refs.canvasContainerRef}
          isReadOnly={isReadOnly}
        >
          {/* Floating Toolbar - Only show for edit mode */}
          {!isReadOnly && (
            <CanvasToolbar
              isToolbarVisible={state.isToolbarVisible}
              onToggleVisibility={() =>
                actions.setIsToolbarVisible(!state.isToolbarVisible)
              }
              tool={state.tool}
              onToolChange={(tool) =>
                handleToolChange(tool, state.strokeColor, state.strokeWidth)
              }
              visibleTools={state.visibleTools}
              onToggleTool={(toolId: string) =>
                actions.setVisibleTools({
                  ...state.visibleTools,
                  [toolId]:
                    !state.visibleTools[
                      toolId as keyof typeof state.visibleTools
                    ],
                })
              }
              onUndo={handleUndo}
              onRedo={handleRedo}
              onSave={savePageState}
              onClearCanvas={handleClearCanvas}
              hasUnsavedChanges={state.hasUnsavedChanges}
              isRecording={state.isRecording}
              isTranscribing={state.isTranscribing}
              isInterpreting={state.isInterpreting}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onAddGraph={() => setGraphDialogOpen(true)}
              toolbarScrollRef={refs.toolbarScrollRef}
              onScrollLeft={() => {
                if (refs.toolbarScrollRef.current) {
                  refs.toolbarScrollRef.current.scrollBy({
                    left: -52,
                    behavior: "smooth",
                  });
                }
              }}
              onScrollRight={() => {
                if (refs.toolbarScrollRef.current) {
                  refs.toolbarScrollRef.current.scrollBy({
                    left: 52,
                    behavior: "smooth",
                  });
                }
              }}
              isReadOnly={isReadOnly}
            />
          )}

          {/* Page Title */}
          <CanvasTitle
            page={page}
            isEditingTitle={state.isEditingTitle}
            tempTitle={state.tempTitle}
            onStartEditing={() => {
              actions.setTempTitle(page.title);
              actions.setIsEditingTitle(true);
            }}
            onTitleChange={actions.setTempTitle}
            onFinishEditing={() => {
              if (state.tempTitle.trim()) {
                onUpdatePage({ title: state.tempTitle.trim() });
              }
              actions.setIsEditingTitle(false);
            }}
            onCancelEditing={() => actions.setIsEditingTitle(false)}
            hasUnsavedChanges={state.hasUnsavedChanges}
            isReadOnly={isReadOnly}
          />

          {/* Drawing Canvas - Only show for edit mode */}
          {!isReadOnly && (
            <div
              className="canvas-clickable absolute inset-0"
              style={{
                minWidth: `${state.canvasSize.width}%`,
                minHeight: `${state.canvasSize.height}%`,
              }}
            >
              <ReactSketchCanvas
                ref={refs.canvasRef}
                strokeWidth={state.strokeWidth}
                strokeColor={
                  state.tool === "eraser"
                    ? document.documentElement.classList.contains("dark")
                      ? "#111111"
                      : "#FAFAFA"
                    : state.strokeColor
                }
                eraserWidth={state.tool === "eraser" ? state.strokeWidth : 0}
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
          )}

          {/* Text Boxes and Graphs Overlay */}
          <CanvasOverlays
            page={page}
            onUpdateTextBoxPosition={handleUpdateTextBoxPosition}
            onUpdateTextBoxText={handleUpdateTextBoxText}
            onRemoveTextBox={handleRemoveTextBox}
            onUpdateGraphPosition={handleUpdateGraphPosition}
            onRemoveGraph={handleRemoveGraph}
            onUpdateGraph={handleUpdateGraph}
            onSizeChange={handleSizeChange}
            onCameraChange={handleCameraChange}
            isReadOnly={isReadOnly}
          />

          {/* Status Indicators */}
          <SaveStatus
            isSaving={state.isSaving}
            saveSuccess={state.saveSuccess}
            error={state.error}
            onClearError={actions.clearError}
          />

          <AudioStatus
            isRecording={state.isRecording}
            isTranscribing={state.isTranscribing}
            isInterpreting={state.isInterpreting}
            transcription={state.transcription}
            onClearTranscription={actions.clearTranscription}
          />
        </CanvasContainer>
      </div>

      <GraphDialog
        open={graphDialogOpen}
        onOpenChange={setGraphDialogOpen}
        onAddGraph={handleAddGraph}
      />
    </>
  );
}
