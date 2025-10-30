import React, { useEffect, useRef, useState } from "react";
import type { GraphSpec, MathematicalGraphSpec } from "@/types";

declare global {
  interface Window {
    Desmos?: any;
  }
}

interface Desmos3DGraphProps {
  graphSpec: GraphSpec;
  width?: number;
  height?: number;
  cameraState?: {
    position: [number, number, number];
    rotation: [number, number, number];
    zoom: number;
  };
  onCameraChange?: (cameraState: {
    position: [number, number, number];
    rotation: [number, number, number];
    zoom: number;
  }) => void;
}

const loadScript = (src: string) => {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src^="${src.split("?")[0]}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Desmos API"));
    document.head.appendChild(s);
  });
};

const toLatexSafe = (expr?: string): string => {
  if (!expr || typeof expr !== "string") return "0";
  return expr.replace(/\^/g, "^").replace(/\bpi\b/g, "pi");
};

const Desmos3DGraph: React.FC<Desmos3DGraphProps> = ({
  graphSpec,
  width = 400,
  height = 300,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const calcRef = useRef<any>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    let destroyed = false;
    const apiKey = (import.meta as any)?.env?.VITE_DESMOS_API_KEY as
      | string
      | undefined;
    if (!apiKey) {
      setStatus("Missing VITE_DESMOS_API_KEY. Add it to your .env and reload.");
      return;
    }
    const src = `https://www.desmos.com/api/v1.12/calculator.js?apiKey=${encodeURIComponent(
      apiKey
    )}`;
    loadScript(src)
      .then(() => {
        if (destroyed) return;
        if (!window.Desmos || !containerRef.current) {
          setStatus("Desmos API not available.");
          return;
        }
        calcRef.current = window.Desmos.Calculator3D(containerRef.current, {
          expressions: true,
          autosize: false,
        });
        setStatus("");
        // Initial sizing
        try {
          calcRef.current.resize();
        } catch {}
      })
      .catch((e) => setStatus(e?.message || "Failed to load Desmos API"));
    return () => {
      destroyed = true;
      if (calcRef.current) {
        try {
          calcRef.current.destroy();
        } catch {}
        calcRef.current = null;
      }
    };
  }, []);

  // Apply graph spec to Desmos
  useEffect(() => {
    const calc = calcRef.current;
    if (!calc) return;
    if (!graphSpec || graphSpec.graphType !== "mathematical") return;
    const mathSpec = graphSpec as MathematicalGraphSpec;
    // Only handle 3D surface/volume-like for now
    if (
      mathSpec.plot.kind !== "3d_surface" &&
      mathSpec.plot.kind !== "3d_integral"
    ) {
      // Clear or set a blank if unsupported kind is routed here
      try {
        calc.setBlank();
      } catch {}
      return;
    }
    try {
      calc.setBlank();
      const expr = toLatexSafe(mathSpec.plot.expressions?.surfaceZ);
      // Desmos 3D expects latex like `z = f(x,y)`
      calc.setExpression({ id: "surface", latex: `z=${expr}` });
      // Bounds if provided
      const x = mathSpec.plot.domain?.x || [-5, 5];
      const y = mathSpec.plot.domain?.y || [-5, 5];
      calc.setViewport({
        x: { min: x[0], max: x[1] },
        y: { min: y[0], max: y[1] },
        z: undefined,
      });
    } catch (e) {
      // If anything fails, keep calculator usable
    }
  }, [graphSpec]);

  // Keep size in sync
  useEffect(() => {
    if (!calcRef.current) return;
    try {
      calcRef.current.resize();
    } catch {}
  }, [width, height]);

  if (status) {
    return (
      <div
        style={{ width, height }}
        className="border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100"
      >
        <div className="text-center p-4">
          <div className="text-gray-600 text-sm">{status}</div>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} style={{ width, height }} />;
};

export default Desmos3DGraph;
