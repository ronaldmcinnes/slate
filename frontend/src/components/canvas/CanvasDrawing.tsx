import { ReactSketchCanvas } from "react-sketch-canvas";
import { useEffect, useState } from "react";

interface CanvasDrawingProps {
  canvasRef: React.RefObject<any>;
  strokeWidth: number;
  strokeColor: string;
  tool: string;
  isDrawingTool: boolean;
  canvasSize: { width: number; height: number };
  onSaveDrawing: () => void;
}

export default function CanvasDrawing({
  canvasRef,
  strokeWidth,
  strokeColor,
  tool,
  isDrawingTool,
  canvasSize,
  onSaveDrawing,
}: CanvasDrawingProps) {
  const [canvasKey, setCanvasKey] = useState(0);

  // Force canvas re-render when theme changes to prevent flicker
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setCanvasKey((prev) => prev + 1);
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
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
        strokeWidth={
          tool === "fountain-pen"
            ? Math.max(1, strokeWidth * 0.7) // Fountain pen has variable pressure
            : strokeWidth
        }
        strokeColor={
          tool === "highlighter"
            ? strokeColor + "80" // Add 50% opacity for highlighter
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
        onChange={onSaveDrawing}
      />
    </div>
  );
}
