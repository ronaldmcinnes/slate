import { useEffect, useState, useRef } from "react";
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
import { useCanvasState } from "@/hooks/useCanvasState";
import { useEraser } from "@/hooks/useEraser";
import { useLassoSelection } from "@/hooks/useLassoSelection";
import { useCanvasHistory } from "@/hooks/useCanvasHistory";
import { decompressDrawingData } from "@/lib/compression";
import type { Page } from "@/types";
import { recognizeMathFromImage } from "@/lib/visionService";

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

  // Canvas state management with persistence
  const {
    state: canvasState,
    setLastUsedTool,
    setStrokeColor,
    setStrokeWidth,
    setCanvasSize,
    setToolbarScrollPosition,
    setIsToolbarVisible,
    setVisibleTools,
  } = useCanvasState();

  // Main canvas hook with persistent state
  const { state, actions, refs, setters } = useCanvas(page, onUpdatePage, {
    strokeColor: canvasState.strokeColor,
    strokeWidth: canvasState.strokeWidth,
    tool: canvasState.lastUsedTool,
    canvasSize: canvasState.canvasSize,
    toolbarScrollPosition: canvasState.toolbarScrollPosition,
    isToolbarVisible: canvasState.isToolbarVisible,
    visibleTools: canvasState.visibleTools,
  });

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

  // Sync canvas state changes to persistent state
  useEffect(() => {
    if (state.tool !== canvasState.lastUsedTool) {
      setLastUsedTool(state.tool);
    }
  }, [state.tool, canvasState.lastUsedTool, setLastUsedTool]);

  useEffect(() => {
    if (state.strokeColor !== canvasState.strokeColor) {
      setStrokeColor(state.strokeColor);
    }
  }, [state.strokeColor, canvasState.strokeColor, setStrokeColor]);

  useEffect(() => {
    if (state.strokeWidth !== canvasState.strokeWidth) {
      setStrokeWidth(state.strokeWidth);
    }
  }, [state.strokeWidth, canvasState.strokeWidth, setStrokeWidth]);

  useEffect(() => {
    if (
      JSON.stringify(state.canvasSize) !==
      JSON.stringify(canvasState.canvasSize)
    ) {
      setCanvasSize(state.canvasSize);
    }
  }, [state.canvasSize, canvasState.canvasSize, setCanvasSize]);

  useEffect(() => {
    if (state.toolbarScrollPosition !== canvasState.toolbarScrollPosition) {
      setToolbarScrollPosition(state.toolbarScrollPosition);
    }
  }, [
    state.toolbarScrollPosition,
    canvasState.toolbarScrollPosition,
    setToolbarScrollPosition,
  ]);

  useEffect(() => {
    if (state.isToolbarVisible !== canvasState.isToolbarVisible) {
      setIsToolbarVisible(state.isToolbarVisible);
    }
  }, [
    state.isToolbarVisible,
    canvasState.isToolbarVisible,
    setIsToolbarVisible,
  ]);

  useEffect(() => {
    if (
      JSON.stringify(state.visibleTools) !==
      JSON.stringify(canvasState.visibleTools)
    ) {
      setVisibleTools(state.visibleTools);
    }
  }, [state.visibleTools, canvasState.visibleTools, setVisibleTools]);

  // Eraser functionality
  const {
    eraserPreview,
    handleEraserMouseDown,
    handleEraserMouseUp,
    handleCanvasMouseMove: handleEraserMouseMove,
    handleCanvasMouseLeave: handleEraserMouseLeave,
  } = useEraser({
    canvasRef: refs.canvasRef,
    canvasContainerRef:
      refs.canvasContainerRef as React.RefObject<HTMLDivElement | null>,
    isReadOnly,
    tool: state.tool,
    strokeWidth: state.strokeWidth,
    markAsChanged: actions.markAsChanged,
  });

  // Lasso selection functionality
  const {
    lassoPoints,
    isLassoing,
    lassoSelection,
    lassoBBox,
    setLassoSelection,
    setLassoBBox,
    setIsLassoing,
    handleLassoMouseDown,
    handleLassoMouseMove,
    handleLassoMouseUp,
  } = useLassoSelection({
    canvasRef: refs.canvasRef,
    canvasContainerRef:
      refs.canvasContainerRef as React.RefObject<HTMLDivElement | null>,
    isReadOnly,
    tool: state.tool,
  });

  // Define after helper is declared further down to satisfy TS ordering
  let snapshotPaths: () => Promise<void>;
  let pushCurrentSnapshot: () => Promise<void>;
  let beginTransformSession: () => void;
  let endTransformSession: () => void;
  let tryCustomUndo: () => Promise<boolean>;
  let tryCustomRedo: () => Promise<boolean>;
  let transformSnapshotPendingRef: React.MutableRefObject<boolean>;

  // Canvas operations
  const handleUndo = async () => {
    const used = await tryCustomUndo();
    if (!used) {
      refs.canvasRef.current?.undo?.();
      await refreshSelectionBBoxFromCanvas();
    }
  };

  const handleRedo = async () => {
    const used = await tryCustomRedo();
    if (!used) {
      refs.canvasRef.current?.redo?.();
      await refreshSelectionBBoxFromCanvas();
    }
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
    // Keep selection bbox in sync with content updates (including undo/redo)
    if (lassoSelection.length > 0) {
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r))
      );
      await recomputeSelectionBBox(lassoSelection);
      setLassoSelection((sel) => (sel.length ? [...sel] : sel));
    }
  };

  // --- Custom history to track programmatic edits (rotate/scale/recolor/delete) ---
  const refreshSelectionBBoxSoon = async () => {
    if (lassoSelection.length === 0) return;
    // Try a few frames in case canvas updates settle late
    for (let i = 0; i < 3; i++) {
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r))
      );
      await recomputeSelectionBBox(lassoSelection);
      // Nudge selection to force re-render if values unchanged
      setLassoSelection((sel) => (sel.length ? [...sel] : sel));
    }
  };
  const refreshSelectionBBoxFromCanvas = async () => {
    if (lassoSelection.length === 0) return;
    const instance: any = refs.canvasRef.current;
    if (!instance) return;
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r))
      );
      const exported: any = (await instance.exportPaths?.()) || [];
      const paths: any[] = Array.isArray(exported)
        ? exported
        : exported.paths || [];
      if (paths.length === 0) continue;
      const valid = lassoSelection.filter((i) => i >= 0 && i < paths.length);
      if (valid.length === 0) {
        setLassoSelection([]);
        setLassoBBox(null);
        return;
      }
      await recomputeSelectionBBox(valid);
      setLassoSelection((sel) => (sel.length ? [...sel] : sel));
      return;
    }
  };

  // Initialize history hook now that refreshSelectionBBoxFromCanvas exists
  {
    const h = useCanvasHistory({
      canvasRef: refs.canvasRef,
      recomputeSelectionBBoxFromCanvas: refreshSelectionBBoxFromCanvas,
    });
    snapshotPaths = h.snapshotPaths;
    pushCurrentSnapshot = h.pushCurrentSnapshot;
    beginTransformSession = h.beginTransformSession;
    endTransformSession = h.endTransformSession;
    tryCustomUndo = h.tryCustomUndo;
    tryCustomRedo = h.tryCustomRedo;
    transformSnapshotPendingRef = h.transformSnapshotPendingRef as any;
  }

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

      // Delete selection with Delete/Backspace
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        lassoSelection.length > 0
      ) {
        e.preventDefault();
        void deleteSelectedStrokes(lassoSelection);
        setLassoSelection([]);
        setLassoBBox(null);
        return;
      }

      // Ctrl+Z - Prefer content undo, then fallback to reselection
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        // Try custom or native undo first
        tryCustomUndo().then((used) => {
          if (used) return;
          if (
            lastDeselectionRef.current?.wasDeselected &&
            lastDeselectionRef.current.indices.length > 0
          ) {
            setLassoSelection(lastDeselectionRef.current.indices);
            setLassoBBox(lastDeselectionRef.current.bbox);
            lastDeselectionRef.current = {
              indices: [],
              bbox: null,
              wasDeselected: false,
            };
            return;
          }
          // Fallback to canvas undo with bbox refresh
          void handleUndo();
        });
      }
      // Ctrl+Y - Redo
      else if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        void handleRedo();
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

        // Wait a bit to ensure the canvas is fully mounted and ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Load drawings from saved state (if present)
        try {
          const instance: any = refs.canvasRef.current;
          if (instance && page.drawings) {
            const decompressed = decompressDrawingData(
              page.drawings as unknown as string
            );
            const paths: any[] = decompressed?.paths || [];
            if (Array.isArray(paths) && paths.length > 0) {
              await instance.clearCanvas?.();
              await instance.loadPaths?.(paths);
              console.log(`Loaded ${paths.length} saved paths into canvas`);
            }
          }
        } catch (e) {
          console.warn("Failed to load saved drawings into canvas", e);
        }
      } catch (error) {
        console.error("Failed to load page content:", error);
      }
    };

    loadPageContent();
  }, [page?.id, page?.drawings, page?.textBoxes, page?.graphs]);

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

  // Determine if canvas should be interactive for drawing (disable for lasso)
  const isDrawingTool =
    state.tool !== "pan" &&
    state.tool !== "text" &&
    state.tool !== "lasso" &&
    state.tool !== "eraser";

  // Get cursor style based on tool
  const getCursorStyle = () => {
    // For view-only users, always show hand cursor to indicate panning/scrolling
    if (isReadOnly) return "grab";

    if (state.tool === "text") return "text";
    if (state.tool === "pan") return "grab";
    if (state.tool === "lasso") return "crosshair";
    if (state.tool === "eraser") return "default";
    return "crosshair";
  };

  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const selectionDragRef = useRef({ startX: 0, startY: 0 });
  const [isTransformingSelection, setIsTransformingSelection] = useState(false);
  const transformRef = useRef<{
    mode: "resize" | "rotate" | null;
    prevAngle?: number;
    prevDist?: number;
    cx?: number;
    cy?: number;
  }>({ mode: null });

  const handleLassoMouseDownWrapped = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly || state.tool !== "lasso" || isTransformingSelection) return;
    const container = refs.canvasContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + container.scrollLeft;
    const y = e.clientY - rect.top + container.scrollTop;
    if (lassoSelection.length > 0 && lassoBBox) {
      const inside =
        x >= lassoBBox.x &&
        y >= lassoBBox.y &&
        x <= lassoBBox.x + lassoBBox.w &&
        y <= lassoBBox.y + lassoBBox.h;
      if (!inside) {
        lastDeselectionRef.current = {
          indices: [...lassoSelection],
          bbox: lassoBBox,
          wasDeselected: true,
        };
        setLassoSelection([]);
        setLassoBBox(null);
      }
    }
    if (
      lassoSelection.length > 0 &&
      lassoBBox &&
      x >= lassoBBox.x &&
      y >= lassoBBox.y &&
      x <= lassoBBox.x + lassoBBox.w &&
      y <= lassoBBox.y + lassoBBox.h
    ) {
      setIsDraggingSelection(true);
      selectionDragRef.current = { startX: x, startY: y };
      return;
    }
    handleLassoMouseDown(e);
  };
  const handleLassoMouseMoveWrapped = async (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (state.tool !== "lasso" || isTransformingSelection) return;
    const container = refs.canvasContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + container.scrollLeft;
    const y = e.clientY - rect.top + container.scrollTop;
    if (isDraggingSelection && lassoSelection.length > 0) {
      const dx = x - selectionDragRef.current.startX;
      const dy = y - selectionDragRef.current.startY;
      selectionDragRef.current = { startX: x, startY: y };
      await translateSelectedStrokes(lassoSelection, dx, dy);
      if (lassoBBox)
        setLassoBBox({
          x: lassoBBox.x + dx,
          y: lassoBBox.y + dy,
          w: lassoBBox.w,
          h: lassoBBox.h,
        });
      return;
    }
    handleLassoMouseMove(e);
  };
  const handleLassoMouseUpWrapped = async () => {
    if (state.tool !== "lasso") return;
    if (isTransformingSelection) return; // handled by transform listeners
    if (isDraggingSelection) {
      setIsDraggingSelection(false);
      document.body.style.userSelect = "";
      return;
    }
    await handleLassoMouseUp();
  };

  // Export current lasso selection to an image (for OCR)
  const exportSelectionToImage = async (): Promise<Blob | null> => {
    if (!lassoBBox || lassoSelection.length === 0) return null;
    const instance: any = refs.canvasRef.current;
    if (!instance) return null;
    const exported: any = (await instance.exportPaths?.()) || [];
    const paths: any[] = Array.isArray(exported)
      ? exported
      : exported.paths || [];
    const padding = 16;
    const width = Math.max(1, Math.ceil(lassoBBox.w + padding * 2));
    const height = Math.max(1, Math.ceil(lassoBBox.h + padding * 2));
    const off = document.createElement("canvas");
    off.width = width;
    off.height = height;
    const ctx = off.getContext("2d");
    if (!ctx) return null;
    // White background for best OCR contrast
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const selectedSet = new Set(lassoSelection);
    for (let i = 0; i < paths.length; i++) {
      if (!selectedSet.has(i)) continue;
      const pts =
        paths[i]?.paths ||
        paths[i]?.points ||
        paths[i]?.stroke?.points ||
        paths[i]?.path ||
        [];
      if (!Array.isArray(pts) || pts.length === 0) continue;
      ctx.beginPath();
      for (let j = 0; j < pts.length; j++) {
        const p = pts[j];
        const px = (p?.x ?? p?.[0]) as number;
        const py = (p?.y ?? p?.[1]) as number;
        if (px == null || py == null) continue;
        const x = px - lassoBBox.x + padding;
        const y = py - lassoBBox.y + padding;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    return await new Promise<Blob | null>((resolve) =>
      off.toBlob((b) => resolve(b), "image/png", 1)
    );
  };

  // Visualize: OCR lasso → interpret → add graph
  const handleVisualizeSelection = async () => {
    try {
      const img = await exportSelectionToImage();
      if (!img) return;
      const recognized = await recognizeMathFromImage(img);
      // Reuse the interpreter from audio flow
      const graphSpec = await refs.audioService.current.interpretTranscription(
        recognized
      );
      const graphs = page?.graphs || [];
      const newGraph = {
        id: Date.now().toString(),
        type: "threejs",
        data: graphSpec,
        layout: {},
        position: {
          x: (lassoBBox?.x || 100) + (lassoBBox?.w || 0) + 20,
          y: lassoBBox?.y || 100,
        },
        size: { width: 500, height: 400 },
        graphSpec,
      } as any;
      graphs.push(newGraph);
      onUpdatePage({ graphs });
    } catch (e) {
      console.error("Visualize selection failed", e);
    }
  };

  // While lassoing or transforming, prevent text selection globally
  useEffect(() => {
    if ((isLassoing || isTransformingSelection) && state.tool === "lasso") {
      const prevent = (e: Event) => e.preventDefault();
      document.addEventListener("selectstart", prevent);
      document.body.style.userSelect = "none";
      return () => {
        document.removeEventListener("selectstart", prevent);
        document.body.style.userSelect = "";
      };
    }
  }, [isLassoing, isTransformingSelection, state.tool]);

  // pointInPolygon moved to canvasUtils and used by useLassoSelection

  // Translate selected strokes helper
  const translateSelectedStrokes = async (
    indices: number[],
    dx: number,
    dy: number
  ) => {
    const instance: any = refs.canvasRef.current;
    if (!instance || indices.length === 0) return;
    const exported: any = (await instance.exportPaths?.()) || [];
    const paths: any[] = Array.isArray(exported)
      ? exported
      : exported.paths || [];
    const updated = paths.map((p: any, i: number) => {
      if (!indices.includes(i)) return p;
      const pts = p?.paths || p?.points || p?.stroke?.points || p?.path;
      if (!Array.isArray(pts)) return p;
      const shift = (pt: any) => {
        const px = pt.x ?? pt[0];
        const py = pt.y ?? pt[1];
        if (pt.x != null && pt.y != null)
          return { ...pt, x: px + dx, y: py + dy };
        return [px + dx, py + dy];
      };
      if (p.paths) return { ...p, paths: pts.map(shift) };
      if (p.points) return { ...p, points: pts.map(shift) };
      if (p.stroke?.points)
        return { ...p, stroke: { ...p.stroke, points: pts.map(shift) } };
      if (p.path) return { ...p, path: pts.map(shift) };
      return p;
    });
    await instance.clearCanvas?.();
    await instance.loadPaths?.(updated);
  };

  // Scale around bbox center
  const scaleSelectedStrokes = async (indices: number[], factor: number) => {
    if (!lassoBBox) return;
    const cx = lassoBBox.x + lassoBBox.w / 2;
    const cy = lassoBBox.y + lassoBBox.h / 2;
    await transformSelectedStrokes(indices, (px, py) => {
      return [cx + (px - cx) * factor, cy + (py - cy) * factor];
    });
    await recomputeSelectionBBox(indices);
  };

  // Rotate around bbox center
  const rotateSelectedStrokes = async (indices: number[], degrees: number) => {
    if (!lassoBBox) return;
    const rad = (degrees * Math.PI) / 180;
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);
    const cx = lassoBBox.x + lassoBBox.w / 2;
    const cy = lassoBBox.y + lassoBBox.h / 2;
    await transformSelectedStrokes(indices, (px, py) => {
      const dx = px - cx;
      const dy = py - cy;
      return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
    });
    await recomputeSelectionBBox(indices);
  };

  // Recolor selected
  const recolorSelectedStrokes = async (indices: number[], color: string) => {
    const instance: any = refs.canvasRef.current;
    if (!instance || indices.length === 0) return;
    await snapshotPaths();
    const exported: any = (await instance.exportPaths?.()) || [];
    const paths: any[] = Array.isArray(exported)
      ? exported
      : exported.paths || [];
    const updated = paths.map((p: any, i: number) => {
      if (!indices.includes(i)) return p;
      if (p.strokeColor) return { ...p, strokeColor: color };
      if (p.stroke?.color) return { ...p, stroke: { ...p.stroke, color } };
      if (p.color) return { ...p, color };
      return { ...p, strokeColor: color };
    });
    await instance.clearCanvas?.();
    await instance.loadPaths?.(updated);
  };

  // Change stroke width of selected
  const restyleWidthSelectedStrokes = async (
    indices: number[],
    width: number
  ) => {
    const instance: any = refs.canvasRef.current;
    if (!instance || indices.length === 0) return;
    await snapshotPaths();
    const exported: any = (await instance.exportPaths?.()) || [];
    const paths: any[] = Array.isArray(exported)
      ? exported
      : exported.paths || [];
    const updated = paths.map((p: any, i: number) => {
      if (!indices.includes(i)) return p;
      if (p.strokeWidth != null) return { ...p, strokeWidth: width };
      if (p.stroke?.width != null)
        return { ...p, stroke: { ...p.stroke, width } };
      if (p.width != null) return { ...p, width };
      return { ...p, strokeWidth: width };
    });
    await instance.clearCanvas?.();
    await instance.loadPaths?.(updated);
    await recomputeSelectionBBox(indices);
  };

  // Generic transform for selected paths
  const transformSelectedStrokes = async (
    indices: number[],
    mapFn: (x: number, y: number) => [number, number]
  ) => {
    const instance: any = refs.canvasRef.current;
    if (!instance || indices.length === 0) return;
    if (!(transformSnapshotPendingRef as any)?.current) {
      await snapshotPaths();
    }
    const exported: any = (await instance.exportPaths?.()) || [];
    const paths: any[] = Array.isArray(exported)
      ? exported
      : exported.paths || [];
    const updated = paths.map((p: any, i: number) => {
      if (!indices.includes(i)) return p;
      const pts = p?.paths || p?.points || p?.stroke?.points || p?.path;
      if (!Array.isArray(pts)) return p;
      const mapPoint = (pt: any) => {
        const px = pt.x ?? pt[0];
        const py = pt.y ?? pt[1];
        const [nx, ny] = mapFn(px, py);
        if (pt.x != null && pt.y != null) return { ...pt, x: nx, y: ny };
        return [nx, ny];
      };
      if (p.paths) return { ...p, paths: pts.map(mapPoint) };
      if (p.points) return { ...p, points: pts.map(mapPoint) };
      if (p.stroke?.points)
        return { ...p, stroke: { ...p.stroke, points: pts.map(mapPoint) } };
      if (p.path) return { ...p, path: pts.map(mapPoint) };
      return p;
    });
    await instance.clearCanvas?.();
    await instance.loadPaths?.(updated);
  };

  const recomputeSelectionBBox = async (indices: number[]) => {
    const instance: any = refs.canvasRef.current;
    if (!instance || indices.length === 0) return;
    const exported: any = (await instance.exportPaths?.()) || [];
    const paths: any[] = Array.isArray(exported)
      ? exported
      : exported.paths || [];
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (let i = 0; i < paths.length; i++) {
      if (!indices.includes(i)) continue;
      const pts =
        paths[i]?.paths ||
        paths[i]?.points ||
        paths[i]?.stroke?.points ||
        paths[i]?.path ||
        [];
      if (!Array.isArray(pts)) continue;
      for (const p of pts) {
        const px = p.x ?? p[0];
        const py = p.y ?? p[1];
        if (px < minX) minX = px;
        if (py < minY) minY = py;
        if (px > maxX) maxX = px;
        if (py > maxY) maxY = py;
      }
    }
    if (isFinite(minX))
      setLassoBBox({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
  };

  // Delete selected stroke indices
  const deleteSelectedStrokes = async (indices: number[]) => {
    const instance: any = refs.canvasRef.current;
    if (!instance || indices.length === 0) return;
    await snapshotPaths();
    const exported: any = (await instance.exportPaths?.()) || [];
    const paths: any[] = Array.isArray(exported)
      ? exported
      : exported.paths || [];
    const keepSet = new Set(indices);
    const remaining = paths.filter((_: any, i: number) => !keepSet.has(i));
    await instance.clearCanvas?.();
    await instance.loadPaths?.(remaining);
    actions.markAsChanged();
  };

  // Track last deselection for Ctrl+Z reselect
  const lastDeselectionRef = useRef<{
    indices: number[];
    bbox: { x: number; y: number; w: number; h: number } | null;
    wasDeselected: boolean;
  }>({ indices: [], bbox: null, wasDeselected: false });

  // Keyboard shortcuts for selection transforms
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      if (lassoSelection.length === 0) return;
      if (e.ctrlKey && !e.altKey) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          await rotateSelectedStrokes(lassoSelection, -5);
          return;
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          await rotateSelectedStrokes(lassoSelection, 5);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          await scaleSelectedStrokes(lassoSelection, 1.1);
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          await scaleSelectedStrokes(lassoSelection, 0.9);
          return;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lassoSelection, lassoBBox]);

  // Flip black/white stroke colors based on theme for readability
  const mapColorForTheme = (c: any, isDark: boolean): any => {
    if (!c) return c;
    const toHex = (s: string) => s.trim().toLowerCase();
    const isBlack = (s: string) => {
      const v = toHex(s);
      return (
        v === "#000" ||
        v === "#000000" ||
        v === "black" ||
        /^rgba?\(\s*0\s*,\s*0\s*,\s*0(\s*,\s*(0|0?\.\d+|1(\.0+)?)\s*)?\)$/.test(
          v
        )
      );
    };
    const isWhite = (s: string) => {
      const v = toHex(s);
      return (
        v === "#fff" ||
        v === "#ffffff" ||
        v === "white" ||
        /^rgba?\(\s*255\s*,\s*255\s*,\s*255(\s*,\s*(0|0?\.\d+|1(\.0+)?)\s*)?\)$/.test(
          v
        )
      );
    };
    const toWhite = (alpha?: number) =>
      alpha != null ? `rgba(255,255,255,${alpha})` : "#FFFFFF";
    const toBlack = (alpha?: number) =>
      alpha != null ? `rgba(0,0,0,${alpha})` : "#000000";

    if (typeof c === "string") {
      if (isDark && isBlack(c)) return "#FFFFFF";
      if (!isDark && isWhite(c)) return "#000000";
      return c;
    }
    // Object forms possibly { color, width } etc.
    const next: any = { ...c };
    if (typeof next === "object") {
      const base = next.color ?? next.strokeColor ?? next.fillColor;
      if (typeof base === "string") {
        let alpha: number | undefined;
        const m = base.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\)$/i);
        if (m) alpha = parseFloat(m[1]);
        if (isDark && isBlack(base))
          next.color = next.strokeColor = toWhite(alpha);
        if (!isDark && isWhite(base))
          next.color = next.strokeColor = toBlack(alpha);
      }
    }
    return next;
  };

  // Keep an immutable snapshot of original paths to avoid cumulative loss on flips
  const originalPathsRef = useRef<any[] | null>(null);

  useEffect(() => {
    // After loading page drawings, cache originals
    (async () => {
      const instance: any = refs.canvasRef.current;
      if (!instance) return;
      try {
        const exported: any = (await instance.exportPaths?.()) || [];
        const paths: any[] = Array.isArray(exported)
          ? exported
          : exported.paths || [];
        if (Array.isArray(paths) && paths.length > 0) {
          originalPathsRef.current = JSON.parse(JSON.stringify(paths));
        }
      } catch {}
    })();
  }, [page?.id]);

  const flipStrokeColorsForTheme = async () => {
    const instance: any = refs.canvasRef.current;
    if (!instance) return;
    try {
      // Use cached originals if available to avoid repeated resampling
      let basePaths: any[] | null = originalPathsRef.current;
      if (!basePaths) {
        const exported: any = (await instance.exportPaths?.()) || [];
        basePaths = Array.isArray(exported) ? exported : exported.paths || [];
      }
      const paths: any[] = Array.isArray(basePaths) ? basePaths : [];
      if (!paths.length) return;
      const isDark = document.documentElement.classList.contains("dark");
      const mapped = paths.map((p: any) => {
        const q = { ...p } as any;
        if (q.strokeColor)
          q.strokeColor = mapColorForTheme(q.strokeColor, isDark);
        if (q.color) q.color = mapColorForTheme(q.color, isDark);
        if (q.stroke && typeof q.stroke === "object") {
          q.stroke = { ...q.stroke };
          if (q.stroke.color)
            q.stroke.color = mapColorForTheme(q.stroke.color, isDark);
        }
        return q;
      });
      await instance.clearCanvas?.();
      await instance.loadPaths?.(mapped);
    } catch {}
  };

  // Observe theme toggles to flip black/white strokes
  useEffect(() => {
    const obs = new MutationObserver(() => {
      void flipStrokeColorsForTheme();
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    // Apply once on mount
    void flipStrokeColorsForTheme();
    return () => obs.disconnect();
  }, []);

  // Early return for no page selected
  if (!page) {
    return <NoPageSelected />;
  }

  return (
    <>
      <div className="flex-1 flex flex-col">
        {/* Canvas Area */}
        <CanvasContainer
          canvasSize={state.canvasSize}
          onCanvasSizeChange={actions.setCanvasSize}
          cursorStyle={getCursorStyle()}
          canvasContainerRef={refs.canvasContainerRef}
          isReadOnly={isReadOnly}
          isPanActive={state.tool === "pan"}
        >
          {/* Floating Toolbar - Only show for edit mode */}
          {!isReadOnly && (
            <CanvasToolbar
              isToolbarVisible={state.isToolbarVisible}
              onToggleVisibility={() =>
                actions.setIsToolbarVisible(!state.isToolbarVisible)
              }
              tool={state.tool}
              onToolChange={(tool, color, width) =>
                handleToolChange(
                  tool,
                  color || state.strokeColor,
                  width || state.strokeWidth
                )
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
                userSelect:
                  state.tool === "lasso" &&
                  (isLassoing || isTransformingSelection)
                    ? "none"
                    : "auto",
              }}
              onMouseMove={(e) => {
                handleEraserMouseMove(e);
                handleLassoMouseMoveWrapped(e);
              }}
              onMouseLeave={handleEraserMouseLeave}
              onMouseDown={(e) => {
                handleEraserMouseDown(e);
                handleLassoMouseDownWrapped(e);
              }}
              onMouseUp={(e) => {
                handleEraserMouseUp();
                handleLassoMouseUpWrapped();
              }}
            >
              {(() => {
                // Honor user-selected color; only apply alpha for highlighter
                const effectiveStrokeColor =
                  state.tool === "highlighter"
                    ? state.strokeColor + "80"
                    : state.strokeColor;
                return (
                  <ReactSketchCanvas
                    key={`canvas-${page?.id || "no-page"}`}
                    ref={refs.canvasRef}
                    strokeWidth={
                      state.tool === "fountain-pen"
                        ? Math.max(1, state.strokeWidth * 0.7) // Fountain pen has variable pressure
                        : state.strokeWidth
                    }
                    strokeColor={effectiveStrokeColor}
                    eraserWidth={
                      state.tool === "eraser" ? state.strokeWidth : 0
                    }
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
                    allowOnlyPointerType="all"
                    preserveBackgroundImageAspectRatio="none"
                  />
                );
              })()}

              {/* Eraser size preview */}
              {state.tool === "eraser" && eraserPreview.visible && (
                <div
                  className="pointer-events-none absolute border border-dashed rounded-full"
                  style={{
                    left: eraserPreview.x,
                    top: eraserPreview.y,
                    width: `${Math.max(2, state.strokeWidth)}px`,
                    height: `${Math.max(2, state.strokeWidth)}px`,
                    transform: "translate(-50%, -50%)",
                    borderColor: "var(--border)",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.05)",
                  }}
                />
              )}

              {/* Lasso overlay (snaps closed) */}
              {state.tool === "lasso" &&
                (isLassoing || lassoPoints.length > 0) && (
                  <svg
                    className="pointer-events-none absolute inset-0"
                    width="100%"
                    height="100%"
                  >
                    <polyline
                      points={[
                        ...lassoPoints,
                        ...(lassoPoints[0] ? [lassoPoints[0]] : []),
                      ]
                        .map((p) => `${p.x},${p.y}`)
                        .join(" ")}
                      fill="rgba(59,130,246,0.08)"
                      stroke="rgba(59,130,246,0.9)"
                      strokeWidth={1}
                    />
                  </svg>
                )}

              {/* Compact palette for color and width */}
              {state.tool === "lasso" &&
                lassoSelection.length > 0 &&
                lassoBBox &&
                !isTransformingSelection && (
                  <div
                    className="absolute bg-card/90 backdrop-blur border border-border rounded-md shadow p-1 flex items-center gap-2"
                    style={{
                      left: lassoBBox.x,
                      top: Math.max(0, lassoBBox.y - 30),
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onMouseMove={(e) => e.stopPropagation()}
                  >
                    {[
                      "#000000",
                      "#EF4444",
                      "#3B82F6",
                      "#10B981",
                      "#F59E0B",
                      "#FFFFFF",
                    ].map((c) => (
                      <button
                        key={c}
                        className="w-4 h-4 rounded-full border border-border hover:scale-110"
                        style={{ backgroundColor: c }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await recolorSelectedStrokes(lassoSelection, c);
                        }}
                        title="Change color"
                      />
                    ))}
                    <div className="w-px h-4 bg-border" />
                    <input
                      type="range"
                      min={1}
                      max={40}
                      defaultValue={state.strokeWidth}
                      className="h-1 cursor-ew-resize"
                      onChange={async (e) => {
                        const w = Number(e.currentTarget.value) || 1;
                        await restyleWidthSelectedStrokes(lassoSelection, w);
                      }}
                      title="Stroke width"
                    />
                    <div className="w-px h-4 bg-border" />
                    <button
                      className="px-2 py-0.5 text-xs rounded border border-border hover:bg-accent"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await handleVisualizeSelection();
                      }}
                      title="Visualize selection"
                    >
                      Visualize
                    </button>
                  </div>
                )}
              {/* Selection bbox */}
              {state.tool === "lasso" &&
                lassoSelection.length > 0 &&
                lassoBBox && (
                  <div
                    className="pointer-events-none absolute border border-primary/60 rounded-sm"
                    style={{
                      left: lassoBBox.x,
                      top: lassoBBox.y,
                      width: lassoBBox.w,
                      height: lassoBBox.h,
                    }}
                  />
                )}

              {/* Transform handles for selection */}
              {state.tool === "lasso" &&
                lassoSelection.length > 0 &&
                lassoBBox && (
                  <>
                    {["nw", "ne", "se", "sw"].map((corner) => {
                      const pos: any = {
                        nw: { left: lassoBBox.x - 6, top: lassoBBox.y - 6 },
                        ne: {
                          left: lassoBBox.x + lassoBBox.w - 6,
                          top: lassoBBox.y - 6,
                        },
                        se: {
                          left: lassoBBox.x + lassoBBox.w - 6,
                          top: lassoBBox.y + lassoBBox.h - 6,
                        },
                        sw: {
                          left: lassoBBox.x - 6,
                          top: lassoBBox.y + lassoBBox.h - 6,
                        },
                      }[corner];
                      return (
                        <div
                          key={corner}
                          className="absolute w-3 h-3 bg-primary rounded-sm border border-background cursor-nwse-resize"
                          style={{ ...pos }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            if (!lassoBBox) return;
                            setIsTransformingSelection(true);
                            const cx = lassoBBox.x + lassoBBox.w / 2;
                            const cy = lassoBBox.y + lassoBBox.h / 2;
                            const rect = (
                              refs.canvasContainerRef.current as HTMLDivElement
                            ).getBoundingClientRect();
                            const sx =
                              e.clientX -
                              rect.left +
                              (
                                refs.canvasContainerRef
                                  .current as HTMLDivElement
                              ).scrollLeft;
                            const sy =
                              e.clientY -
                              rect.top +
                              (
                                refs.canvasContainerRef
                                  .current as HTMLDivElement
                              ).scrollTop;
                            const dist = Math.hypot(sx - cx, sy - cy);
                            transformRef.current = {
                              mode: "resize",
                              prevDist: Math.max(1, dist),
                              cx,
                              cy,
                            };
                            beginTransformSession();
                            const onMove = async (ev: MouseEvent) => {
                              if (transformSnapshotPendingRef.current) return;
                              const rx =
                                ev.clientX -
                                rect.left +
                                (
                                  refs.canvasContainerRef
                                    .current as HTMLDivElement
                                ).scrollLeft;
                              const ry =
                                ev.clientY -
                                rect.top +
                                (
                                  refs.canvasContainerRef
                                    .current as HTMLDivElement
                                ).scrollTop;
                              const newDist = Math.hypot(rx - cx, ry - cy);
                              const factor = Math.max(
                                0.2,
                                Math.min(
                                  5,
                                  newDist /
                                    (transformRef.current.prevDist || newDist)
                                )
                              );
                              transformRef.current.prevDist = newDist;
                              await scaleSelectedStrokes(
                                lassoSelection,
                                factor
                              );
                            };
                            const onUp = () => {
                              setIsTransformingSelection(false);
                              document.removeEventListener("mousemove", onMove);
                              document.removeEventListener("mouseup", onUp);
                              endTransformSession();
                            };
                            document.addEventListener("mousemove", onMove);
                            document.addEventListener("mouseup", onUp);
                          }}
                        />
                      );
                    })}
                    {/* Rotation handle near top-right corner */}
                    <div
                      className="absolute w-3 h-3 bg-primary rounded-full border border-background cursor-crosshair"
                      style={{
                        left: lassoBBox.x + lassoBBox.w + 8,
                        top: lassoBBox.y - 16,
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        if (!lassoBBox) return;
                        setIsTransformingSelection(true);
                        const rect = (
                          refs.canvasContainerRef.current as HTMLDivElement
                        ).getBoundingClientRect();
                        const cx = lassoBBox.x + lassoBBox.w / 2;
                        const cy = lassoBBox.y + lassoBBox.h / 2;
                        const sx =
                          e.clientX -
                          rect.left +
                          (refs.canvasContainerRef.current as HTMLDivElement)
                            .scrollLeft;
                        const sy =
                          e.clientY -
                          rect.top +
                          (refs.canvasContainerRef.current as HTMLDivElement)
                            .scrollTop;
                        transformRef.current = {
                          mode: "rotate",
                          prevAngle: Math.atan2(sy - cy, sx - cx),
                          cx,
                          cy,
                        };
                        beginTransformSession();
                        const onMove = async (ev: MouseEvent) => {
                          if (transformSnapshotPendingRef.current) return;
                          const rx =
                            ev.clientX -
                            rect.left +
                            (refs.canvasContainerRef.current as HTMLDivElement)
                              .scrollLeft;
                          const ry =
                            ev.clientY -
                            rect.top +
                            (refs.canvasContainerRef.current as HTMLDivElement)
                              .scrollTop;
                          const ang = Math.atan2(
                            ry - (transformRef.current.cy || 0),
                            rx - (transformRef.current.cx || 0)
                          );
                          const prev = transformRef.current.prevAngle || ang;
                          const deltaDeg = ((ang - prev) * 180) / Math.PI;
                          transformRef.current.prevAngle = ang;
                          await rotateSelectedStrokes(lassoSelection, deltaDeg);
                        };
                        const onUp = () => {
                          setIsTransformingSelection(false);
                          document.removeEventListener("mousemove", onMove);
                          document.removeEventListener("mouseup", onUp);
                          endTransformSession();
                        };
                        document.addEventListener("mousemove", onMove);
                        document.addEventListener("mouseup", onUp);
                      }}
                      title="Rotate"
                    />
                  </>
                )}

              {/* Inline controls removed per request - color/rotate/scale via handles/keyboard */}
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
            viewport={{
              x: 0,
              y: 0,
              width: state.canvasSize.width,
              height: state.canvasSize.height,
              zoom: 1,
            }}
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

      {/* While using the lasso tool, add a capture layer above overlays to prevent text selection */}
      {state.tool === "lasso" && (
        <div
          className="absolute inset-0"
          style={{
            zIndex: 1000,
            pointerEvents:
              isLassoing || isTransformingSelection ? "auto" : "none",
          }}
          onMouseMove={(e) =>
            handleLassoMouseMove(
              e as unknown as React.MouseEvent<HTMLDivElement>
            )
          }
          onMouseDown={(e) =>
            handleLassoMouseDown(
              e as unknown as React.MouseEvent<HTMLDivElement>
            )
          }
          onMouseUp={(e) => handleLassoMouseUp()}
        />
      )}

      <GraphDialog
        open={graphDialogOpen}
        onOpenChange={setGraphDialogOpen}
        onAddGraph={handleAddGraph}
      />
    </>
  );
}
