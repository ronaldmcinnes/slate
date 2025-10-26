import { useMemo, useCallback } from "react";
import * as THREE from "three";

interface PerformanceConfig {
  enableAdaptiveQuality: boolean;
  enableFrustumCulling: boolean;
  enableLOD: boolean;
  maxTriangles: number;
  qualityLevels: {
    low: { resolution: number; maxTriangles: number };
    medium: { resolution: number; maxTriangles: number };
    high: { resolution: number; maxTriangles: number };
  };
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableAdaptiveQuality: true,
  enableFrustumCulling: true,
  enableLOD: true,
  maxTriangles: 100000, // Increased maximum triangles per graph
  qualityLevels: {
    low: { resolution: 150, maxTriangles: 25000 }, // Increased minimum resolution
    medium: { resolution: 300, maxTriangles: 50000 }, // Increased medium resolution
    high: { resolution: 500, maxTriangles: 100000 }, // Increased high resolution
  },
};

export function useGraphPerformance(
  config: Partial<PerformanceConfig> = {},
  qualityLevel: keyof PerformanceConfig["qualityLevels"] = "medium"
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Calculate optimal resolution based on zoom and performance
  const calculateOptimalResolution = useCallback(
    (baseResolution: number, zoom: number, graphCount: number): number => {
      if (!finalConfig.enableAdaptiveQuality) return baseResolution;

      // Less aggressive zoom reduction - maintain better quality when zoomed out
      const zoomFactor = Math.max(0.5, Math.min(1, 1 / Math.sqrt(zoom)));

      // Less aggressive graph count reduction
      const graphFactor = Math.max(0.6, Math.min(1, 5 / graphCount));

      // Apply quality level with higher base resolution
      const qualityFactor =
        finalConfig.qualityLevels[qualityLevel].resolution / 300;

      return Math.max(
        100, // Increased minimum resolution from 20 to 100
        Math.floor(baseResolution * zoomFactor * graphFactor * qualityFactor)
      );
    },
    [finalConfig.enableAdaptiveQuality, finalConfig.qualityLevels, qualityLevel]
  );

  // Check if graph should be culled based on viewport
  const shouldCullGraph = useCallback(
    (
      graphPosition: { x: number; y: number; width: number; height: number },
      viewport: {
        x: number;
        y: number;
        width: number;
        height: number;
        zoom: number;
      }
    ): boolean => {
      if (!finalConfig.enableFrustumCulling) return false;

      const margin = 100; // Pixels outside viewport to still render
      const scaledMargin = margin / viewport.zoom;

      return (
        graphPosition.x + graphPosition.width < viewport.x - scaledMargin ||
        graphPosition.x > viewport.x + viewport.width + scaledMargin ||
        graphPosition.y + graphPosition.height < viewport.y - scaledMargin ||
        graphPosition.y > viewport.y + viewport.height + scaledMargin
      );
    },
    [finalConfig.enableFrustumCulling]
  );

  // Calculate LOD level based on distance and zoom
  const calculateLODLevel = useCallback(
    (
      graphPosition: { x: number; y: number },
      viewport: {
        x: number;
        y: number;
        width: number;
        height: number;
        zoom: number;
      }
    ): "low" | "medium" | "high" => {
      if (!finalConfig.enableLOD) return "high";

      // Calculate distance from viewport center
      const viewportCenterX = viewport.x + viewport.width / 2;
      const viewportCenterY = viewport.y + viewport.height / 2;
      const graphCenterX = graphPosition.x;
      const graphCenterY = graphPosition.y;

      const distance = Math.sqrt(
        Math.pow(graphCenterX - viewportCenterX, 2) +
          Math.pow(graphCenterY - viewportCenterY, 2)
      );

      // Scale distance by zoom - less aggressive LOD switching
      const scaledDistance = distance / viewport.zoom;

      if (scaledDistance > 2000) return "low"; // Increased threshold
      if (scaledDistance > 1000) return "medium"; // Increased threshold
      return "high";
    },
    [finalConfig.enableLOD]
  );

  // Optimize geometry based on performance requirements
  const optimizeGeometry = useCallback(
    (
      geometry: THREE.BufferGeometry,
      targetTriangles: number
    ): THREE.BufferGeometry => {
      const currentTriangles = geometry.index
        ? geometry.index.count / 3
        : geometry.attributes.position.count / 3;

      if (currentTriangles <= targetTriangles) return geometry;

      // Simple decimation - keep every nth vertex
      const decimationFactor = Math.ceil(currentTriangles / targetTriangles);

      if (geometry.index) {
        // Indexed geometry - decimate indices
        const indices = geometry.index.array;
        const newIndices: number[] = [];

        for (let i = 0; i < indices.length; i += decimationFactor * 3) {
          if (i + 2 < indices.length) {
            newIndices.push(indices[i], indices[i + 1], indices[i + 2]);
          }
        }

        geometry.setIndex(newIndices);
      } else {
        // Non-indexed geometry - decimate vertices
        const positions = geometry.attributes.position.array;
        const newPositions: number[] = [];

        for (let i = 0; i < positions.length; i += decimationFactor * 3) {
          if (i + 2 < positions.length) {
            newPositions.push(positions[i], positions[i + 1], positions[i + 2]);
          }
        }

        geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(newPositions, 3)
        );
      }

      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();

      return geometry;
    },
    []
  );

  // Create shared materials for better performance
  const createSharedMaterials = useCallback(() => {
    const materials = {
      line: new THREE.LineBasicMaterial({
        color: 0x3b82f6,
        linewidth: 2, // Increased line width for better visibility
        transparent: false,
        opacity: 1.0,
      }),
      surface: new THREE.MeshLambertMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.9, // Increased opacity for better visibility
        side: THREE.DoubleSide,
      }),
      area: new THREE.MeshBasicMaterial({
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.6, // Increased opacity for better visibility
        side: THREE.DoubleSide,
      }),
    };

    // Enable material sharing
    Object.values(materials).forEach((material) => {
      material.needsUpdate = false;
    });

    return materials;
  }, []);

  // Batch multiple graphs into a single geometry
  const batchGraphs = useCallback(
    (
      graphs: Array<{
        geometry: THREE.BufferGeometry;
        material: THREE.Material;
        position: THREE.Vector3;
      }>
    ) => {
      if (graphs.length === 0) return null;

      const batchedGeometry = new THREE.BufferGeometry();
      const positions: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];
      let vertexOffset = 0;

      graphs.forEach(({ geometry, position }) => {
        const posArray = geometry.attributes.position.array;
        const normalArray = geometry.attributes.normal?.array;
        const indexArray = geometry.index?.array;

        // Add vertices with position offset
        for (let i = 0; i < posArray.length; i += 3) {
          positions.push(
            posArray[i] + position.x,
            posArray[i + 1] + position.y,
            posArray[i + 2] + position.z
          );
        }

        // Add normals if available
        if (normalArray) {
          for (let i = 0; i < normalArray.length; i++) {
            normals.push(normalArray[i]);
          }
        }

        // Add indices with vertex offset
        if (indexArray) {
          for (let i = 0; i < indexArray.length; i++) {
            indices.push(indexArray[i] + vertexOffset);
          }
        }

        vertexOffset += posArray.length / 3;
      });

      batchedGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
      );
      if (normals.length > 0) {
        batchedGeometry.setAttribute(
          "normal",
          new THREE.Float32BufferAttribute(normals, 3)
        );
      }
      if (indices.length > 0) {
        batchedGeometry.setIndex(indices);
      }

      return batchedGeometry;
    },
    []
  );

  // Mock performance metrics for now
  const metrics = {
    fps: 60, // Default to 60 FPS
    frameTime: 16.67, // Default frame time in ms
    memoryUsage: 0, // Memory usage in MB
  };

  return {
    config: finalConfig,
    metrics,

    // Performance optimization functions
    calculateOptimalResolution,
    shouldCullGraph,
    calculateLODLevel,
    optimizeGeometry,
    createSharedMaterials,
    batchGraphs,
  };
}
