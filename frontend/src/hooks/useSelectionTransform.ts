import { useState, useRef, useEffect } from "react";
import {
  exportPathsFromCanvas,
  translateSelectedPaths,
  scaleSelectedPaths,
  rotateSelectedPaths,
  recolorSelectedPaths,
  restyleWidthSelectedPaths,
  deleteSelectedPaths,
  recomputeSelectionBBox,
} from "@/lib/pathEditors";

interface UseSelectionTransformProps {
  canvasRef: React.RefObject<any>;
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
  lassoSelection: number[];
  lassoBBox: { x: number; y: number; w: number; h: number } | null;
  setLassoBBox: (
    bbox: { x: number; y: number; w: number; h: number } | null
  ) => void;
  snapshotPaths: () => Promise<void>;
  transformSnapshotPendingRef: React.MutableRefObject<boolean>;
  beginTransformSession: () => void;
  endTransformSession: () => void;
  markAsChanged: () => void;
}

export function useSelectionTransform({
  canvasRef,
  canvasContainerRef,
  lassoSelection,
  lassoBBox,
  setLassoBBox,
  snapshotPaths,
  transformSnapshotPendingRef,
  beginTransformSession,
  endTransformSession,
  markAsChanged,
}: UseSelectionTransformProps) {
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

  // Translate selected strokes
  const translateSelectedStrokes = async (
    indices: number[],
    dx: number,
    dy: number
  ) => {
    const instance: any = canvasRef.current;
    if (!instance || indices.length === 0) return;
    const paths = await exportPathsFromCanvas(instance);
    await translateSelectedPaths(instance, paths, indices, dx, dy);
    if (lassoBBox)
      setLassoBBox({
        x: lassoBBox.x + dx,
        y: lassoBBox.y + dy,
        w: lassoBBox.w,
        h: lassoBBox.h,
      });
  };

  // Scale around bbox center
  const scaleSelectedStrokes = async (indices: number[], factor: number) => {
    if (!lassoBBox) return;
    const cx = lassoBBox.x + lassoBBox.w / 2;
    const cy = lassoBBox.y + lassoBBox.h / 2;
    const instance: any = canvasRef.current;
    if (!instance || indices.length === 0) return;
    const paths = await exportPathsFromCanvas(instance);
    await scaleSelectedPaths(instance, paths, indices, cx, cy, factor);
    const newBBox = await recomputeSelectionBBox(instance, indices);
    if (newBBox) setLassoBBox(newBBox);
  };

  // Rotate around bbox center
  const rotateSelectedStrokes = async (indices: number[], degrees: number) => {
    if (!lassoBBox) return;
    const cx = lassoBBox.x + lassoBBox.w / 2;
    const cy = lassoBBox.y + lassoBBox.h / 2;
    const instance: any = canvasRef.current;
    if (!instance || indices.length === 0) return;
    const paths = await exportPathsFromCanvas(instance);
    await rotateSelectedPaths(instance, paths, indices, cx, cy, degrees);
    const newBBox = await recomputeSelectionBBox(instance, indices);
    if (newBBox) setLassoBBox(newBBox);
  };

  // Recolor selected
  const recolorSelectedStrokes = async (indices: number[], color: string) => {
    const instance: any = canvasRef.current;
    if (!instance || indices.length === 0) return;
    await snapshotPaths();
    const paths = await exportPathsFromCanvas(instance);
    await recolorSelectedPaths(instance, paths, indices, color);
  };

  // Change stroke width of selected
  const restyleWidthSelectedStrokes = async (
    indices: number[],
    width: number
  ) => {
    const instance: any = canvasRef.current;
    if (!instance || indices.length === 0) return;
    await snapshotPaths();
    const paths = await exportPathsFromCanvas(instance);
    await restyleWidthSelectedPaths(instance, paths, indices, width);
    const newBBox = await recomputeSelectionBBox(instance, indices);
    if (newBBox) setLassoBBox(newBBox);
  };

  // Delete selected stroke indices
  const deleteSelectedStrokes = async (indices: number[]) => {
    const instance: any = canvasRef.current;
    if (!instance || indices.length === 0) return;
    await snapshotPaths();
    const paths = await exportPathsFromCanvas(instance);
    await deleteSelectedPaths(instance, paths, indices);
    markAsChanged();
  };

  // Recompute selection bbox
  const recomputeBBox = async (indices: number[]) => {
    const instance: any = canvasRef.current;
    const newBBox = await recomputeSelectionBBox(instance, indices);
    if (newBBox) setLassoBBox(newBBox);
  };

  // Handle drag start on selection
  const handleDragStart = (x: number, y: number) => {
    setIsDraggingSelection(true);
    selectionDragRef.current = { startX: x, startY: y };
  };

  // Handle drag move
  const handleDragMove = async (x: number, y: number) => {
    if (!isDraggingSelection || lassoSelection.length === 0) return;
    const dx = x - selectionDragRef.current.startX;
    const dy = y - selectionDragRef.current.startY;
    selectionDragRef.current = { startX: x, startY: y };
    await translateSelectedStrokes(lassoSelection, dx, dy);
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (!isDraggingSelection) return;
    setIsDraggingSelection(false);
    document.body.style.userSelect = "";
  };

  // Handle resize transform start
  const handleResizeStart = (
    e: React.MouseEvent,
    corner: "nw" | "ne" | "se" | "sw"
  ) => {
    if (!lassoBBox) return;
    setIsTransformingSelection(true);
    const cx = lassoBBox.x + lassoBBox.w / 2;
    const cy = lassoBBox.y + lassoBBox.h / 2;
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx =
      e.clientX - rect.left + (canvasContainerRef.current?.scrollLeft || 0);
    const sy =
      e.clientY - rect.top + (canvasContainerRef.current?.scrollTop || 0);
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
        ev.clientX - rect.left + (canvasContainerRef.current?.scrollLeft || 0);
      const ry =
        ev.clientY - rect.top + (canvasContainerRef.current?.scrollTop || 0);
      const newDist = Math.hypot(rx - cx, ry - cy);
      const factor = Math.max(
        0.2,
        Math.min(5, newDist / (transformRef.current.prevDist || newDist))
      );
      transformRef.current.prevDist = newDist;
      await scaleSelectedStrokes(lassoSelection, factor);
    };
    const onUp = () => {
      setIsTransformingSelection(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      endTransformSession();
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // Handle rotate transform start
  const handleRotateStart = (e: React.MouseEvent) => {
    if (!lassoBBox) return;
    setIsTransformingSelection(true);
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = lassoBBox.x + lassoBBox.w / 2;
    const cy = lassoBBox.y + lassoBBox.h / 2;
    const sx =
      e.clientX - rect.left + (canvasContainerRef.current?.scrollLeft || 0);
    const sy =
      e.clientY - rect.top + (canvasContainerRef.current?.scrollTop || 0);
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
        ev.clientX - rect.left + (canvasContainerRef.current?.scrollLeft || 0);
      const ry =
        ev.clientY - rect.top + (canvasContainerRef.current?.scrollTop || 0);
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
  };

  // Keyboard shortcuts for selection transforms
  useEffect(() => {
    if (lassoSelection.length === 0) return;
    const onKey = async (e: KeyboardEvent) => {
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

  return {
    // State
    isDraggingSelection,
    isTransformingSelection,
    // Transform functions
    translateSelectedStrokes,
    scaleSelectedStrokes,
    rotateSelectedStrokes,
    recolorSelectedStrokes,
    restyleWidthSelectedStrokes,
    deleteSelectedStrokes,
    recomputeBBox,
    // Drag handlers
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    // Transform handlers
    handleResizeStart,
    handleRotateStart,
  };
}
