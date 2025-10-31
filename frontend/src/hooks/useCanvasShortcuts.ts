import { useEffect, useRef } from "react";

interface UseCanvasShortcutsProps {
  isReadOnly: boolean;
  tool: string;
  lassoSelection: number[];
  setLassoSelection: (sel: number[]) => void;
  setLassoBBox: (
    bbox: { x: number; y: number; w: number; h: number } | null
  ) => void;
  deleteSelectedStrokes: (indices: number[]) => Promise<void>;
  // Undo/Redo wrappers
  handleUndo: () => Promise<void>;
  handleRedo: () => Promise<void>;
  // Save
  savePageState: () => void | Promise<void>;
  // For special reselection fallback on undo
  tryCustomUndo: () => Promise<boolean>;
  lastDeselectionRef: React.MutableRefObject<{
    indices: number[];
    bbox: { x: number; y: number; w: number; h: number } | null;
    wasDeselected: boolean;
  }>;
  // Tool and stroke width management
  setTool: (tool: string) => void;
  setStrokeWidth: (width: number) => void;
  strokeWidth: number;
  // Zoom management (for pan mode)
  zoom?: number;
  setZoom?: (zoom: number) => void;
  // Microphone handlers
  onStartRecording?: () => void;
  onStopRecording?: () => void;
}

export function useCanvasShortcuts({
  isReadOnly,
  tool,
  lassoSelection,
  setLassoSelection,
  setLassoBBox,
  deleteSelectedStrokes,
  handleUndo,
  handleRedo,
  savePageState,
  tryCustomUndo,
  lastDeselectionRef,
  setTool,
  setStrokeWidth,
  strokeWidth,
  zoom = 1,
  setZoom,
  onStartRecording,
  onStopRecording,
}: UseCanvasShortcutsProps) {
  // Track microphone key hold state
  const micKeyDownTimeRef = useRef<number | null>(null);
  const micKeyHoldTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isReadOnly) return;

      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Tool shortcuts (L, P, H, E) - single key press, no modifiers
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        // L for lasso
        if (e.key === "l" || e.key === "L") {
          e.preventDefault();
          setTool("lasso");
          return;
        }

        // P for pan
        if (e.key === "p" || e.key === "P") {
          e.preventDefault();
          setTool("pan");
          return;
        }

        // H for highlighter
        if (e.key === "h" || e.key === "H") {
          e.preventDefault();
          setTool("highlighter");
          return;
        }

        // E for eraser
        if (e.key === "e" || e.key === "E") {
          e.preventDefault();
          setTool("eraser");
          return;
        }

        // S for microphone - track keydown time for hold detection
        if ((e.key === "s" || e.key === "S") && onStartRecording) {
          e.preventDefault();
          micKeyDownTimeRef.current = Date.now();
          // If key held for > 200ms, start recording
          micKeyHoldTimeoutRef.current = window.setTimeout(() => {
            if (micKeyDownTimeRef.current && onStartRecording) {
              onStartRecording();
            }
          }, 200);
          return;
        }
      }

      // Ctrl+Plus/Minus for tool size (when not in pan mode) or zoom (when in pan mode)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        const isPlus = e.key === "+" || e.key === "=";
        const isMinus = e.key === "-" || e.key === "_";

        if (isPlus || isMinus) {
          e.preventDefault();

          if (tool === "pan" && setZoom) {
            // Zoom in/out when in pan mode
            const zoomDelta = isPlus ? 1.2 : 0.833; // ~20% zoom steps
            const newZoom = Math.max(0.1, Math.min(5, zoom * zoomDelta));
            setZoom(newZoom);
          } else {
            // Change tool size for other tools
            const sizeDelta = isPlus ? 2 : -2;
            const newWidth = Math.max(
              1,
              Math.min(100, strokeWidth + sizeDelta)
            );
            setStrokeWidth(newWidth);
          }
          return;
        }
      }

      // Delete selection
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        lassoSelection.length > 0
      ) {
        e.preventDefault();
        void (async () => {
          await deleteSelectedStrokes(lassoSelection);
          setLassoSelection([]);
          setLassoBBox(null);
        })();
        return;
      }

      // Ctrl+Z (Undo) with reselection fallback
      if (e.ctrlKey && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        void (async () => {
          const used = await tryCustomUndo();
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
          await handleUndo();
        })();
        return;
      }

      // Ctrl+Shift+Z (Redo)
      if (e.ctrlKey && e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        void handleRedo();
        return;
      }

      // Ctrl+S (Save) - only if not microphone recording
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "s" || e.key === "S") &&
        !micKeyDownTimeRef.current
      ) {
        e.preventDefault();
        void savePageState();
        return;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      // Handle microphone key release
      if ((e.key === "s" || e.key === "S") && onStopRecording) {
        const keyDownTime = micKeyDownTimeRef.current;
        if (micKeyHoldTimeoutRef.current) {
          clearTimeout(micKeyHoldTimeoutRef.current);
          micKeyHoldTimeoutRef.current = null;
        }

        // If key was held for > 200ms, stop recording
        // If key was released quickly (< 200ms), it was just a click, don't do anything
        if (keyDownTime && Date.now() - keyDownTime > 200 && onStopRecording) {
          onStopRecording();
        }

        micKeyDownTimeRef.current = null;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (micKeyHoldTimeoutRef.current) {
        clearTimeout(micKeyHoldTimeoutRef.current);
      }
    };
  }, [
    isReadOnly,
    tool,
    lassoSelection,
    setLassoSelection,
    setLassoBBox,
    deleteSelectedStrokes,
    handleUndo,
    handleRedo,
    savePageState,
    tryCustomUndo,
    lastDeselectionRef,
    setTool,
    setStrokeWidth,
    strokeWidth,
    zoom,
    setZoom,
    onStartRecording,
    onStopRecording,
  ]);
}
