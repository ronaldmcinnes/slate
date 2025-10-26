import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import type { GraphSpec, MathematicalGraphSpec } from "@/types";
import { useGraphPerformance } from "@/hooks/useGraphPerformance";

interface OptimizedThreeJSGraphProps {
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
  viewport?: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
  };
  graphCount?: number;
}

// Optimized graph mesh component with performance optimizations
const OptimizedGraphMesh: React.FC<{
  graphSpec: GraphSpec;
  viewport?: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
  };
  graphCount?: number;
}> = ({ graphSpec, viewport, graphCount = 1 }) => {
  const meshRef = useRef<THREE.Group>(null);
  const {
    calculateOptimalResolution,
    shouldCullGraph,
    calculateLODLevel,
    optimizeGeometry,
    createSharedMaterials,
  } = useGraphPerformance();

  // Shared materials for better performance
  const materials = useMemo(
    () => createSharedMaterials(),
    [createSharedMaterials]
  );

  // Memoized graph generation with performance optimizations
  const generateOptimizedGraph = useCallback(() => {
    if (!meshRef.current || graphSpec.graphType !== "mathematical") return;

    const mathSpec = graphSpec as MathematicalGraphSpec;

    // Calculate optimal resolution based on performance metrics
    const baseResolution = mathSpec.plot.resolution || 200;
    const optimalResolution = calculateOptimalResolution(
      baseResolution,
      viewport?.zoom || 1,
      graphCount
    );

    // Calculate LOD level
    const lodLevel = calculateLODLevel(
      { x: 0, y: 0 }, // Graph position (would be passed from parent)
      viewport || { x: 0, y: 0, width: 800, height: 600, zoom: 1 }
    );

    // Adjust resolution based on LOD
    const finalResolution = Math.floor(
      optimalResolution *
        (lodLevel === "low" ? 0.3 : lodLevel === "medium" ? 0.6 : 1.0)
    );

    // Clear existing children
    meshRef.current.clear();

    let points: THREE.Vector3[] = [];
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    // Generate points with optimized resolution
    const optimizedSpec = {
      ...mathSpec,
      plot: {
        ...mathSpec.plot,
        resolution: finalResolution,
      },
    };

    // Generate points based on graph type
    switch (mathSpec.plot.kind) {
      case "2d_explicit":
        points = generate2DPoints(optimizedSpec);
        break;
      case "2d_parametric":
        points = generateParametricPoints(optimizedSpec);
        break;
      case "2d_polar":
        points = generatePolarPoints(optimizedSpec);
        break;
      case "3d_surface":
        points = generate3DSurface(optimizedSpec);
        break;
      default:
        console.warn("Unsupported graph type:", mathSpec.plot.kind);
        return;
    }

    if (points.length === 0) return;

    // Create optimized geometry
    geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Optimize geometry based on performance requirements
    const maxTriangles =
      lodLevel === "low" ? 5000 : lodLevel === "medium" ? 15000 : 50000;
    geometry = optimizeGeometry(geometry, maxTriangles);

    // Use shared materials
    if (mathSpec.plot.kind === "3d_surface") {
      material = materials.surface;
      const mesh = new THREE.Mesh(geometry, material);
      meshRef.current.add(mesh);
    } else {
      material = materials.line;
      const line = new THREE.Line(geometry, material);
      meshRef.current.add(line);
    }
  }, [
    graphSpec,
    viewport,
    graphCount,
    calculateOptimalResolution,
    calculateLODLevel,
    optimizeGeometry,
    materials,
  ]);

  useEffect(() => {
    generateOptimizedGraph();
  }, [generateOptimizedGraph]);

  return <group ref={meshRef} />;
};

// Optimized point generation functions with performance improvements
const generate2DPoints = (spec: MathematicalGraphSpec): THREE.Vector3[] => {
  const { domain, expressions, resolution = 100 } = spec.plot;
  const points: THREE.Vector3[] = [];

  if (!domain.x || !expressions.yOfX) return points;

  const [xMin, xMax] = domain.x;
  const step = (xMax - xMin) / resolution;

  for (let i = 0; i <= resolution; i++) {
    const x = xMin + i * step;
    try {
      const y = evaluateExpression(expressions.yOfX, "x", x);
      if (isFinite(y)) {
        points.push(new THREE.Vector3(x, y, 0));
      }
    } catch (error) {
      // Skip invalid points silently for better performance
    }
  }

  return points;
};

const generateParametricPoints = (
  spec: MathematicalGraphSpec
): THREE.Vector3[] => {
  const { domain, expressions, resolution = 100 } = spec.plot;
  const points: THREE.Vector3[] = [];

  if (!domain.t || !expressions.xOfT || !expressions.yOfT) return points;

  const [tMin, tMax] = domain.t;
  const step = (tMax - tMin) / resolution;

  for (let i = 0; i <= resolution; i++) {
    const t = tMin + i * step;
    try {
      const x = evaluateExpression(expressions.xOfT, "t", t);
      const y = evaluateExpression(expressions.yOfT, "t", t);
      if (isFinite(x) && isFinite(y)) {
        points.push(new THREE.Vector3(x, y, 0));
      }
    } catch (error) {
      // Skip invalid points silently
    }
  }

  return points;
};

const generatePolarPoints = (spec: MathematicalGraphSpec): THREE.Vector3[] => {
  const { domain, expressions, resolution = 100 } = spec.plot;
  const points: THREE.Vector3[] = [];

  if (!domain.x || !expressions.rOfTheta) return points;

  const [thetaMin, thetaMax] = domain.x;
  const step = (thetaMax - thetaMin) / resolution;

  for (let i = 0; i <= resolution; i++) {
    const theta = thetaMin + i * step;
    try {
      const r = evaluateExpression(expressions.rOfTheta, "theta", theta);
      if (isFinite(r) && r >= 0) {
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, 0));
      }
    } catch (error) {
      // Skip invalid points silently
    }
  }

  return points;
};

const generate3DSurface = (spec: MathematicalGraphSpec): THREE.Vector3[] => {
  const { domain, expressions, resolution = 50 } = spec.plot; // Reduced default resolution
  const points: THREE.Vector3[] = [];

  if (!domain.x || !domain.y || !expressions.surfaceZ) return points;

  const [xMin, xMax] = domain.x;
  const [yMin, yMax] = domain.y;
  const xStep = (xMax - xMin) / resolution;
  const yStep = (yMax - yMin) / resolution;

  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = xMin + i * xStep;
      const y = yMin + j * yStep;
      try {
        const z = evaluateExpression(expressions.surfaceZ, "x", x, "y", y);
        if (isFinite(z)) {
          points.push(new THREE.Vector3(x, y, z));
        }
      } catch (error) {
        // Skip invalid points silently
      }
    }
  }

  return points;
};

// Optimized expression evaluation with caching
const expressionCache = new Map<string, number>();
const evaluateExpression = (
  expression: string,
  variable: string,
  value: number,
  variable2?: string,
  value2?: number
): number => {
  const cacheKey = `${expression}-${variable}-${value}-${variable2}-${value2}`;

  if (expressionCache.has(cacheKey)) {
    return expressionCache.get(cacheKey)!;
  }

  try {
    let cleanExpression = expression
      .replace(/\^/g, "**")
      .replace(/\bpi\b/g, "Math.PI")
      .replace(/\be\b/g, "Math.E");

    const mathScope = {
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      asin: Math.asin,
      acos: Math.acos,
      atan: Math.atan,
      exp: Math.exp,
      log: Math.log,
      log10: Math.log10,
      sqrt: Math.sqrt,
      abs: Math.abs,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      min: Math.min,
      max: Math.max,
      pow: Math.pow,
      Math: Math,
    };

    let result: number;
    if (variable2 !== undefined && value2 !== undefined) {
      const func = new Function(
        variable,
        variable2,
        ...Object.keys(mathScope),
        `return ${cleanExpression}`
      );
      result = func(value, value2, ...Object.values(mathScope));
    } else {
      const func = new Function(
        variable,
        ...Object.keys(mathScope),
        `return ${cleanExpression}`
      );
      result = func(value, ...Object.values(mathScope));
    }

    // Cache the result
    expressionCache.set(cacheKey, result);

    // Limit cache size to prevent memory leaks
    if (expressionCache.size > 1000) {
      const firstKey = expressionCache.keys().next().value;
      expressionCache.delete(firstKey);
    }

    return result;
  } catch (error) {
    return 0;
  }
};

const OptimizedThreeJSGraph: React.FC<OptimizedThreeJSGraphProps> = ({
  graphSpec,
  width = 400,
  height = 300,
  cameraState,
  onCameraChange,
  viewport,
  graphCount = 1,
}) => {
  const { metrics } = useGraphPerformance();

  // Optimized Canvas settings for better performance
  const canvasSettings = useMemo(
    () => ({
      camera: {
        position: cameraState?.position || [0, 0, 15],
        fov: 50,
        rotation: cameraState?.rotation || [0, 0, 0],
        zoom: cameraState?.zoom || 1,
      },
      gl: {
        antialias: metrics.fps > 30, // Only enable antialiasing if performance is good
        alpha: true,
        powerPreference: "high-performance" as const,
        logarithmicDepthBuffer: false, // Disable for better performance
        precision: "mediump" as const, // Use medium precision for better performance
      },
    }),
    [cameraState, metrics.fps]
  );

  return (
    <div
      style={{ width, height }}
      className="border border-gray-300 rounded-lg overflow-hidden"
    >
      <Canvas {...canvasSettings}>
        {/* Optimized lighting - single directional light for better performance */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={0.6}
          castShadow={false} // Disable shadows for better performance
        />

        <OptimizedGraphMesh
          graphSpec={graphSpec}
          viewport={viewport}
          graphCount={graphCount}
        />

        {graphSpec.graphType === "mathematical" && (
          <>
            {/* Simplified grid for better performance */}
            <Grid
              position={[0, 0, 0]}
              args={[20, 20]}
              cellSize={1}
              cellThickness={0.2}
              cellColor="#888888"
              sectionSize={5}
              sectionThickness={0.5}
              sectionColor="#444444"
              fadeDistance={30}
              fadeStrength={1}
              followCamera={false}
              infiniteGrid={true}
            />
          </>
        )}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
          enableDamping={true} // Enable damping for smoother controls
          dampingFactor={0.05}
          onChange={(e) => {
            if (onCameraChange && e?.target) {
              const camera = e.target.object;
              onCameraChange({
                position: [
                  camera.position.x,
                  camera.position.y,
                  camera.position.z,
                ],
                rotation: [
                  camera.rotation.x,
                  camera.rotation.y,
                  camera.rotation.z,
                ],
                zoom: camera.zoom,
              });
            }
          }}
        />
      </Canvas>
    </div>
  );
};

export default OptimizedThreeJSGraph;
