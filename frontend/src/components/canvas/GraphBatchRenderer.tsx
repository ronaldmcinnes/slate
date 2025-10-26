import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { GraphSpec, MathematicalGraphSpec } from "@/types";
import { useGraphPerformance } from "@/hooks/useGraphPerformance";

interface GraphBatchRendererProps {
  graphs: Array<{
    id: string;
    graphSpec: GraphSpec;
    position: { x: number; y: number };
    size: { width: number; height: number };
    cameraState?: {
      position: [number, number, number];
      rotation: [number, number, number];
      zoom: number;
    };
  }>;
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
  };
  onCameraChange?: (cameraState: {
    position: [number, number, number];
    rotation: [number, number, number];
    zoom: number;
  }) => void;
}

// Batch renderer component that renders multiple graphs efficiently
const BatchGraphMesh: React.FC<{
  graphs: Array<{
    id: string;
    graphSpec: GraphSpec;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }>;
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
  };
}> = ({ graphs, viewport }) => {
  const meshRef = useRef<THREE.Group>(null);
  const {
    shouldCullGraph,
    calculateLODLevel,
    optimizeGeometry,
    createSharedMaterials,
    batchGraphs,
  } = useGraphPerformance();

  // Shared materials for all graphs
  const materials = useMemo(
    () => createSharedMaterials(),
    [createSharedMaterials]
  );

  // Memoized graph generation with batching
  const generateBatchedGraphs = useCallback(() => {
    if (!meshRef.current) return;

    // Clear existing children
    meshRef.current.clear();

    // Filter graphs that should be rendered (frustum culling)
    const visibleGraphs = graphs.filter((graph) => {
      const graphBounds = {
        x: graph.position.x,
        y: graph.position.y,
        width: graph.size.width,
        height: graph.size.height,
      };
      return !shouldCullGraph(graphBounds, viewport);
    });

    if (visibleGraphs.length === 0) return;

    // Group graphs by type for batching
    const graphGroups = new Map<
      string,
      Array<{
        geometry: THREE.BufferGeometry;
        material: THREE.Material;
        position: THREE.Vector3;
      }>
    >();

    visibleGraphs.forEach((graph) => {
      if (graph.graphSpec.graphType !== "mathematical") return;

      const mathSpec = graph.graphSpec as MathematicalGraphSpec;
      const lodLevel = calculateLODLevel(graph.position, viewport);

      // Calculate optimal resolution based on LOD
      const baseResolution = mathSpec.plot.resolution || 100;
      const resolution = Math.floor(
        baseResolution *
          (lodLevel === "low" ? 0.3 : lodLevel === "medium" ? 0.6 : 1.0)
      );

      // Generate points for this graph
      const points = generateGraphPoints(mathSpec, resolution);
      if (points.length === 0) return;

      // Create geometry
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      // Optimize geometry
      const maxTriangles =
        lodLevel === "low" ? 2000 : lodLevel === "medium" ? 8000 : 20000;
      const optimizedGeometry = optimizeGeometry(geometry, maxTriangles);

      // Determine material type
      const materialType =
        mathSpec.plot.kind === "3d_surface" ? "surface" : "line";
      const material = materials[materialType];

      // Calculate world position
      const worldPosition = new THREE.Vector3(
        graph.position.x / 100, // Scale down for 3D space
        graph.position.y / 100,
        0
      );

      // Add to appropriate group
      if (!graphGroups.has(materialType)) {
        graphGroups.set(materialType, []);
      }
      graphGroups.get(materialType)!.push({
        geometry: optimizedGeometry,
        material,
        position: worldPosition,
      });
    });

    // Create batched meshes for each group
    graphGroups.forEach((graphGroup, materialType) => {
      if (graphGroup.length === 0) return;

      // For single graphs, create individual meshes
      if (graphGroup.length === 1) {
        const { geometry, material, position } = graphGroup[0];
        const mesh =
          materialType === "surface"
            ? new THREE.Mesh(geometry, material)
            : new THREE.Line(geometry, material);
        mesh.position.copy(position);
        meshRef.current!.add(mesh);
        return;
      }

      // For multiple graphs, try to batch them
      try {
        const batchedGeometry = batchGraphs(graphGroup);
        if (batchedGeometry) {
          const material = graphGroup[0].material;
          const mesh =
            materialType === "surface"
              ? new THREE.Mesh(batchedGeometry, material)
              : new THREE.Line(batchedGeometry, material);
          meshRef.current!.add(mesh);
        }
      } catch (error) {
        // Fallback to individual meshes if batching fails
        graphGroup.forEach(({ geometry, material, position }) => {
          const mesh =
            materialType === "surface"
              ? new THREE.Mesh(geometry, material)
              : new THREE.Line(geometry, material);
          mesh.position.copy(position);
          meshRef.current!.add(mesh);
        });
      }
    });
  }, [
    graphs,
    viewport,
    shouldCullGraph,
    calculateLODLevel,
    optimizeGeometry,
    materials,
    batchGraphs,
  ]);

  useEffect(() => {
    generateBatchedGraphs();
  }, [generateBatchedGraphs]);

  return <group ref={meshRef} />;
};

// Optimized point generation functions
const generateGraphPoints = (
  spec: MathematicalGraphSpec,
  resolution: number
): THREE.Vector3[] => {
  const { domain, expressions } = spec.plot;
  const points: THREE.Vector3[] = [];

  if (!domain || !expressions) return points;

  switch (spec.plot.kind) {
    case "2d_explicit":
      return generate2DPoints(spec, resolution);
    case "2d_parametric":
      return generateParametricPoints(spec, resolution);
    case "2d_polar":
      return generatePolarPoints(spec, resolution);
    case "3d_surface":
      return generate3DSurface(spec, resolution);
    default:
      return points;
  }
};

const generate2DPoints = (
  spec: MathematicalGraphSpec,
  resolution: number
): THREE.Vector3[] => {
  const { domain, expressions } = spec.plot;
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
      // Skip invalid points
    }
  }

  return points;
};

const generateParametricPoints = (
  spec: MathematicalGraphSpec,
  resolution: number
): THREE.Vector3[] => {
  const { domain, expressions } = spec.plot;
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
      // Skip invalid points
    }
  }

  return points;
};

const generatePolarPoints = (
  spec: MathematicalGraphSpec,
  resolution: number
): THREE.Vector3[] => {
  const { domain, expressions } = spec.plot;
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
      // Skip invalid points
    }
  }

  return points;
};

const generate3DSurface = (
  spec: MathematicalGraphSpec,
  resolution: number
): THREE.Vector3[] => {
  const { domain, expressions } = spec.plot;
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
        // Skip invalid points
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

    // Cache the result with size limit
    expressionCache.set(cacheKey, result);
    if (expressionCache.size > 500) {
      const firstKey = expressionCache.keys().next().value;
      expressionCache.delete(firstKey);
    }

    return result;
  } catch (error) {
    return 0;
  }
};

const GraphBatchRenderer: React.FC<GraphBatchRendererProps> = ({
  graphs,
  viewport,
  onCameraChange,
}) => {
  // Optimized Canvas settings
  const canvasSettings = useMemo(
    () => ({
      camera: {
        position: [0, 0, 15],
        fov: 50,
      },
      gl: {
        antialias: true, // Enable antialiasing for smooth rendering
        alpha: true,
        powerPreference: "high-performance" as const,
        logarithmicDepthBuffer: false,
        precision: "mediump" as const,
      },
    }),
    []
  );

  return (
    <div className="w-full h-full">
      <Canvas {...canvasSettings}>
        {/* Minimal lighting for better performance */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.4} />

        <BatchGraphMesh graphs={graphs} viewport={viewport} />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
          enableDamping={true}
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

export default GraphBatchRenderer;
