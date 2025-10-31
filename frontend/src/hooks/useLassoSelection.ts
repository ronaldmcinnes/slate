import { useEffect, useRef, useState } from "react";
import { exportPathsFromCanvas, getPathPoints, pointInPolygon } from "@/lib/canvasUtils";

interface UseLassoSelectionProps {
  canvasRef: React.RefObject<any>;
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
  isReadOnly: boolean;
  tool: string;
}

export function useLassoSelection({
  canvasRef,
  canvasContainerRef,
  isReadOnly,
  tool,
}: UseLassoSelectionProps) {
  const [lassoPoints, setLassoPoints] = useState<{ x: number; y: number }[]>([]);
  const [isLassoing, setIsLassoing] = useState(false);
  const [lassoSelection, setLassoSelection] = useState<number[]>([]);
  const [lassoBBox, setLassoBBox] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null
  );

  const handleLassoMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly || tool !== "lasso") return;
    const container = canvasContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + container.scrollLeft;
    const y = e.clientY - rect.top + container.scrollTop;
    setIsLassoing(true);
    document.body.style.userSelect = "none";
    setLassoPoints([{ x, y }]);
  };

  const handleLassoMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool !== "lasso") return;
    const container = canvasContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + container.scrollLeft;
    const y = e.clientY - rect.top + container.scrollTop;
    if (!isLassoing) return;
    setLassoPoints((pts) => [...pts, { x, y }]);
  };

  const handleLassoMouseUp = async () => {
    if (tool !== "lasso") return;
    if (!isLassoing) return;
    setIsLassoing(false);
    document.body.style.userSelect = "";
    const poly = lassoPoints.length > 2 ? [...lassoPoints, lassoPoints[0]] : [];
    if (poly.length < 4) {
      setLassoPoints([]);
      return;
    }
    try {
      const instance: any = canvasRef.current;
      const paths = await exportPathsFromCanvas(instance);
      const selected: number[] = [];
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (let i = 0; i < paths.length; i++) {
        const pts = getPathPoints(paths[i]);
        if (pts.length === 0) continue;
        let allInside = true;
        for (const p of pts) {
          if (!pointInPolygon(p.x, p.y, poly)) {
            allInside = false;
            break;
          }
        }
        if (allInside) {
          selected.push(i);
          for (const p of pts) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
          }
        }
      }
      setLassoSelection(selected);
      if (selected.length > 0 && isFinite(minX))
        setLassoBBox({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
      setLassoPoints([]);
    } catch {}
  };

  return {
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
  };
}


