import { useEffect } from "react";

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
}: UseCanvasShortcutsProps) {
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

      // Ctrl+S (Save)
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        void savePageState();
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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
  ]);
}
