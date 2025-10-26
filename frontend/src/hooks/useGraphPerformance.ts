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
  maxTriangles: 50000, // Maximum triangles per graph
  qualityLevels: {
    low: { resolution: 50, maxTriangles: 10000 },
    medium: { resolution: 100, maxTriangles: 25000 },
    high: { resolution: 200, maxTriangles: 50000 },
  },
};

export function useGraphPerformance(config: Partial<PerformanceConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Calculate optimal resolution based on zoom and performance
  const calculateOptimalResolution = useCallback(
    (baseResolution: number, zoom: number, graphCount: number): number => {
      if (!finalConfig.enableAdaptiveQuality) return baseResolution;

      // Reduce resolution based on zoom level
      const zoomFactor = Math.max(0.1, Math.min(1, 1 / zoom));

      // Reduce resolution based on number of graphs
      const graphFactor = Math.max(0.3, Math.min(1, 3 / graphCount));

      // Apply quality level
      const qualityFactor =
        finalConfig.qualityLevels[qualityLevel].resolution / 200;

      return Math.max(
        20,
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

      // Scale distance by zoom
      const scaledDistance = distance / viewport.zoom;

      if (scaledDistance > 1000) return "low";
      if (scaledDistance > 500) return "medium";
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
      line: new THREE.LineBasicMaterial({ color: 0x3b82f6 }),
      surface: new THREE.MeshLambertMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      }),
      area: new THREE.MeshBasicMaterial({
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.4,
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

  return {
    config: finalConfig,

    // Performance optimization functions
    calculateOptimalResolution,
    shouldCullGraph,
    calculateLODLevel,
    optimizeGeometry,
    createSharedMaterials,
    batchGraphs,
  };
}
