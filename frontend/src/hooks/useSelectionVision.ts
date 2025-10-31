import { useCallback } from "react";
import { recognizeMathFromImage } from "@/lib/visionService";
import { exportPathsFromCanvas, getPathPoints } from "@/lib/canvasUtils";
import type { Page } from "@/types";

interface UseSelectionVisionProps {
  canvasRef: React.RefObject<any>;
  lassoSelection: number[];
  lassoBBox: { x: number; y: number; w: number; h: number } | null;
  page: Page | null;
  onUpdatePage: (updates: Partial<Page>) => void;
  audioService: React.RefObject<any>;
}

/**
 * Hook for Vision/OCR functionality on lasso selections
 * - Exports selection to image for OCR
 * - Recognizes math from image
 * - Creates graph from recognized math
 */
export function useSelectionVision({
  canvasRef,
  lassoSelection,
  lassoBBox,
  page,
  onUpdatePage,
  audioService,
}: UseSelectionVisionProps) {
  /**
   * Export current lasso selection to an image (for OCR)
   */
  const exportSelectionToImage = useCallback(async (): Promise<Blob | null> => {
    if (!lassoBBox || lassoSelection.length === 0) return null;
    const instance: any = canvasRef.current;
    if (!instance) return null;

    const paths = await exportPathsFromCanvas(instance);
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
      const pts = getPathPoints(paths[i]);
      if (pts.length === 0) continue;

      ctx.beginPath();
      for (let j = 0; j < pts.length; j++) {
        const p = pts[j];
        const px = p.x;
        const py = p.y;
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
  }, [canvasRef, lassoSelection, lassoBBox]);

  /**
   * Visualize: OCR lasso selection → interpret → add graph
   */
  const handleVisualizeSelection = useCallback(async () => {
    try {
      const img = await exportSelectionToImage();
      if (!img) return;

      const recognized = await recognizeMathFromImage(img);
      // Reuse the interpreter from audio flow
      const graphSpec = await audioService.current?.interpretTranscription(
        recognized
      );
      if (!graphSpec) return;

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
  }, [
    exportSelectionToImage,
    audioService,
    page?.graphs,
    lassoBBox,
    onUpdatePage,
  ]);

  return {
    exportSelectionToImage,
    handleVisualizeSelection,
  };
}

