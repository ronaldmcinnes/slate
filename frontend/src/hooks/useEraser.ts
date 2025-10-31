import { useState, useEffect } from "react";
import {
  exportPathsFromCanvas,
  lineCircleIntersections,
  getPathPoints,
  distPointToSegSq,
} from "@/lib/canvasUtils";

interface UseEraserProps {
  canvasRef: React.RefObject<any>;
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
  isReadOnly: boolean;
  tool: string;
  strokeWidth: number;
  markAsChanged: () => void;
}

export function useEraser({
  canvasRef,
  canvasContainerRef,
  isReadOnly,
  tool,
  strokeWidth,
  markAsChanged,
}: UseEraserProps) {
  const [eraserKind, setEraserKind] = useState<"area" | "stroke">("area");
  const [isErasing, setIsErasing] = useState(false);
  const [eraserPreview, setEraserPreview] = useState({
    x: 0,
    y: 0,
    visible: false,
  });

  // Track eraser type via toolbar broadcast
  useEffect(() => {
    const handler = (e: any) => {
      if (
        e?.detail?.eraserType === "stroke" ||
        e?.detail?.eraserType === "area"
      ) {
        setEraserKind(e.detail.eraserType);
      }
    };
    window.addEventListener("slate-eraser-type", handler as EventListener);
    return () =>
      window.removeEventListener("slate-eraser-type", handler as EventListener);
  }, []);

  // Disable library erase mode; we implement deletion-based erase ourselves
  useEffect(() => {
    const instance: any = canvasRef.current;
    if (!instance || typeof instance.eraseMode !== "function") return;
    try {
      instance.eraseMode(false);
    } catch {}
  }, [tool, canvasRef, eraserKind]);

  // Delete any paths that intersect a circular brush centered at (px, py)
  const erasePathsNear = async (
    px: number,
    py: number,
    threshold: number
  ): Promise<boolean> => {
    const instance: any = canvasRef.current;
    if (!instance) return false;
    try {
      const paths = await exportPathsFromCanvas(instance);
      if (!paths.length) return false;

      const hits: boolean[] = new Array(paths.length).fill(false);
      const threshSq = threshold * threshold;

      for (let i = paths.length - 1; i >= 0; i--) {
        const pts = getPathPoints(paths[i]);
        if (pts.length < 2) continue;
        let hit = false;
        for (let j = 0; j < pts.length - 1 && !hit; j++) {
          const a = pts[j];
          const b = pts[j + 1];
          if (distPointToSegSq(a.x, a.y, b.x, b.y, px, py) <= threshSq)
            hit = true;
        }
        hits[i] = hit;
      }

      if (!hits.some(Boolean)) return false;
      const remaining = paths.filter((_, i) => !hits[i]);
      await instance.clearCanvas?.();
      await instance.loadPaths?.(remaining);
      markAsChanged();
      return true;
    } catch (e) {
      console.error("erasePathsNear failed", e);
      return false;
    }
  };

  // Partially erase paths by clipping polylines against a circle
  const erasePartialPathsNear = async (
    px: number,
    py: number,
    radius: number
  ): Promise<boolean> => {
    const instance: any = canvasRef.current;
    if (!instance) return false;
    try {
      const paths = await exportPathsFromCanvas(instance);
      if (!paths.length) return false;

      const rSq = radius * radius;
      const outside = (x: number, y: number) => {
        const dx = x - px;
        const dy = y - py;
        return dx * dx + dy * dy > rSq;
      };

      const pushSubpath = (
        template: any,
        segment: { x: number; y: number }[],
        out: any[]
      ) => {
        if (segment.length < 2) return;
        const newPath: any = {
          ...template,
          strokeWidth: template.strokeWidth ?? template.width ?? template.size,
          strokeColor:
            template.strokeColor ?? template.color ?? template.stroke,
        };
        if (Array.isArray(template.paths)) newPath.paths = segment;
        else if (Array.isArray(template.points)) newPath.points = segment;
        else if (template?.stroke?.points)
          newPath.stroke = { ...template.stroke, points: segment };
        else newPath.path = segment;
        out.push(newPath);
      };

      const rebuilt: any[] = [];
      for (const p of paths) {
        const pts = getPathPoints(p);
        if (pts.length === 0) {
          // Invalid path with no points, skip it
          continue;
        }
        if (pts.length === 1) {
          // Single point paths (dots) - delete if inside circle
          const pt = pts[0];
          if (!outside(pt.x, pt.y)) {
            // Point is inside eraser circle, skip it
            continue;
          }
          // Point is outside, keep it
          rebuilt.push(p);
          continue;
        }

        let current: { x: number; y: number }[] = [];
        if (outside(pts[0].x, pts[0].y)) current.push(pts[0]);

        for (let j = 0; j < pts.length - 1; j++) {
          const a = pts[j];
          const b = pts[j + 1];
          const ts = lineCircleIntersections(
            a.x,
            a.y,
            b.x,
            b.y,
            px,
            py,
            radius
          );

          if (ts.length === 0) {
            if (outside(a.x, a.y) && outside(b.x, b.y)) {
              if (current.length === 0) current.push(a);
              current.push(b);
            } else {
              if (current.length >= 2) pushSubpath(p, current, rebuilt);
              current = [];
            }
            continue;
          }

          const tVals = [0, ...ts, 1];
          for (let k = 0; k < tVals.length - 1; k++) {
            const t0 = tVals[k];
            const t1 = tVals[k + 1];
            const p0 = {
              x: a.x + (b.x - a.x) * t0,
              y: a.y + (b.y - a.y) * t0,
            };
            const p1 = {
              x: a.x + (b.x - a.x) * t1,
              y: a.y + (b.y - a.y) * t1,
            };
            const midT = (t0 + t1) / 2;
            const mid = {
              x: a.x + (b.x - a.x) * midT,
              y: a.y + (b.y - a.y) * midT,
            };
            const midOut = outside(mid.x, mid.y);
            if (midOut) {
              if (current.length === 0) current.push(p0);
              current.push(p1);
            } else {
              if (current.length >= 2) pushSubpath(p, current, rebuilt);
              current = [];
            }
          }
        }

        if (current.length >= 2) pushSubpath(p, current, rebuilt);
      }

      await instance.clearCanvas?.();
      await instance.loadPaths?.(rebuilt);
      markAsChanged();
      return true;
    } catch (e) {
      console.error("erasePartialPathsNear failed", e);
      return false;
    }
  };

  const handleEraserMouseDown = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly || tool !== "eraser") return;
    e.preventDefault();
    setIsErasing(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "crosshair";
    if (!canvasContainerRef.current) return;

    const rect = canvasContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + canvasContainerRef.current.scrollLeft;
    const y = e.clientY - rect.top + canvasContainerRef.current.scrollTop;

    if (eraserKind === "stroke") {
      await erasePathsNear(x, y, Math.max(3, Math.floor(strokeWidth)));
    } else if (eraserKind === "area") {
      await erasePartialPathsNear(
        x,
        y,
        Math.max(1, Math.floor(strokeWidth / 2))
      );
    }
  };

  const handleEraserMouseUp = () => {
    if (!isErasing) return;
    setIsErasing(false);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly || tool !== "eraser") {
      if (eraserPreview.visible)
        setEraserPreview((p) => ({ ...p, visible: false }));
      return;
    }
    if (!canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + canvasContainerRef.current.scrollLeft;
    const y = e.clientY - rect.top + canvasContainerRef.current.scrollTop;
    setEraserPreview({ x, y, visible: true });
  };

  const handleCanvasMouseLeave = () => {
    if (eraserPreview.visible)
      setEraserPreview((p) => ({ ...p, visible: false }));
  };

  // Stroke erase on mousemove
  useEffect(() => {
    if (!isErasing || tool !== "eraser" || eraserKind !== "stroke") return;
    const onMove = async (e: MouseEvent) => {
      if (!canvasContainerRef.current) return;
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const x =
        e.clientX - rect.left + canvasContainerRef.current.scrollLeft;
      const y = e.clientY - rect.top + canvasContainerRef.current.scrollTop;
      await erasePathsNear(x, y, Math.max(3, Math.floor(strokeWidth)));
    };
    document.addEventListener("mousemove", onMove);
    const onUp = () => {
      setIsErasing(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isErasing, eraserKind, tool, strokeWidth]);

  // Area erase on mousemove with throttling for performance
  useEffect(() => {
    if (!isErasing || tool !== "eraser" || eraserKind !== "area") return;
    
    let rafId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let pending = false;

    const performErase = async (x: number, y: number) => {
      pending = false;
      await erasePartialPathsNear(
        x,
        y,
        Math.max(1, Math.floor(strokeWidth / 2))
      );
    };

    const onMove = (e: MouseEvent) => {
      if (!canvasContainerRef.current) return;
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const x =
        e.clientX - rect.left + canvasContainerRef.current.scrollLeft;
      const y = e.clientY - rect.top + canvasContainerRef.current.scrollTop;

      // Update last known position
      lastX = x;
      lastY = y;

      // Throttle using requestAnimationFrame
      if (!pending) {
        pending = true;
        rafId = requestAnimationFrame(() => {
          performErase(lastX, lastY);
        });
      }
    };

    document.addEventListener("mousemove", onMove);
    const onUp = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      setIsErasing(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    document.addEventListener("mouseup", onUp);
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isErasing, eraserKind, tool, strokeWidth]);

  return {
    eraserPreview,
    handleEraserMouseDown,
    handleEraserMouseUp,
    handleCanvasMouseMove,
    handleCanvasMouseLeave,
  };
}

