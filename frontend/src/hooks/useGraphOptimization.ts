import { useState, useCallback, useRef, useEffect } from "react";
import type { Graph } from "@/types";

interface GraphCache {
  rendered: Map<string, boolean>;
  loading: Map<string, boolean>;
  error: Map<string, string>;
}

interface GraphOptimizationConfig {
  enableVirtualization: boolean;
  enableLazyLoading: boolean;
  preloadAdjacentGraphs: boolean;
  maxConcurrentLoads: number;
  renderThreshold: number; // Distance from viewport to start rendering
}

const DEFAULT_CONFIG: GraphOptimizationConfig = {
  enableVirtualization: true,
  enableLazyLoading: true,
  preloadAdjacentGraphs: true,
  maxConcurrentLoads: 3,
  renderThreshold: 200, // pixels
};

export function useGraphOptimization(
  config: Partial<GraphOptimizationConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const cacheRef = useRef<GraphCache>({
    rendered: new Map(),
    loading: new Map(),
    error: new Map(),
  });

  const [loadingQueue, setLoadingQueue] = useState<string[]>([]);
  const [activeLoads, setActiveLoads] = useState<Set<string>>(new Set());

  // Check if graph should be rendered based on viewport position
  const shouldRenderGraph = useCallback(
    (
      graphId: string,
      graphPosition: { x: number; y: number },
      viewport: {
        x: number;
        y: number;
        width: number;
        height: number;
        zoom: number;
      }
    ): boolean => {
      if (!finalConfig.enableVirtualization) return true;

      const threshold = finalConfig.renderThreshold / viewport.zoom;

      // Check if graph is within render threshold of viewport
      const graphInViewport =
        graphPosition.x >= viewport.x - threshold &&
        graphPosition.x <= viewport.x + viewport.width + threshold &&
        graphPosition.y >= viewport.y - threshold &&
        graphPosition.y <= viewport.y + viewport.height + threshold;

      return graphInViewport;
    },
    [finalConfig.enableVirtualization, finalConfig.renderThreshold]
  );

  // Check if graph is already rendered
  const isGraphRendered = useCallback((graphId: string): boolean => {
    return cacheRef.current.rendered.get(graphId) || false;
  }, []);

  // Check if graph is currently loading
  const isGraphLoading = useCallback((graphId: string): boolean => {
    return cacheRef.current.loading.get(graphId) || false;
  }, []);

  // Get graph error if any
  const getGraphError = useCallback((graphId: string): string | null => {
    return cacheRef.current.error.get(graphId) || null;
  }, []);

  // Mark graph as rendered
  const markGraphRendered = useCallback((graphId: string) => {
    cacheRef.current.rendered.set(graphId, true);
    cacheRef.current.loading.set(graphId, false);
    cacheRef.current.error.delete(graphId);
  }, []);

  // Mark graph as loading
  const markGraphLoading = useCallback((graphId: string) => {
    cacheRef.current.loading.set(graphId, true);
    cacheRef.current.error.delete(graphId);
  }, []);

  // Mark graph as error
  const markGraphError = useCallback((graphId: string, error: string) => {
    cacheRef.current.loading.set(graphId, false);
    cacheRef.current.error.set(graphId, error);
  }, []);

  // Queue graph for loading
  const queueGraphForLoading = useCallback(
    (graphId: string) => {
      if (isGraphLoading(graphId) || isGraphRendered(graphId)) return;

      setLoadingQueue((prev) => {
        if (prev.includes(graphId)) return prev;
        return [...prev, graphId];
      });
    },
    [isGraphLoading, isGraphRendered]
  );

  // Process loading queue
  const processLoadingQueue = useCallback(async () => {
    if (activeLoads.size >= finalConfig.maxConcurrentLoads) return;

    const nextGraphId = loadingQueue.find((id) => !activeLoads.has(id));
    if (!nextGraphId) return;

    setActiveLoads((prev) => new Set(prev).add(nextGraphId));
    setLoadingQueue((prev) => prev.filter((id) => id !== nextGraphId));

    markGraphLoading(nextGraphId);

    try {
      // Simulate graph loading - in real implementation, this would load the graph
      await new Promise((resolve) => setTimeout(resolve, 100));
      markGraphRendered(nextGraphId);
    } catch (error) {
      markGraphError(
        nextGraphId,
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setActiveLoads((prev) => {
        const newSet = new Set(prev);
        newSet.delete(nextGraphId);
        return newSet;
      });
    }
  }, [
    activeLoads,
    loadingQueue,
    finalConfig.maxConcurrentLoads,
    markGraphLoading,
    markGraphRendered,
    markGraphError,
  ]);

  // Process queue when it changes
  useEffect(() => {
    if (
      loadingQueue.length > 0 &&
      activeLoads.size < finalConfig.maxConcurrentLoads
    ) {
      processLoadingQueue();
    }
  }, [
    loadingQueue,
    activeLoads.size,
    finalConfig.maxConcurrentLoads,
    processLoadingQueue,
  ]);

  // Optimize graphs based on viewport
  const optimizeGraphsForViewport = useCallback(
    (
      graphs: Graph[],
      viewport: {
        x: number;
        y: number;
        width: number;
        height: number;
        zoom: number;
      }
    ) => {
      const visibleGraphs: Graph[] = [];
      const graphsToQueue: string[] = [];

      graphs.forEach((graph) => {
        if (shouldRenderGraph(graph.id, graph.position, viewport)) {
          visibleGraphs.push(graph);

          if (
            finalConfig.enableLazyLoading &&
            !isGraphRendered(graph.id) &&
            !isGraphLoading(graph.id)
          ) {
            graphsToQueue.push(graph.id);
          }
        }
      });

      // Queue graphs for loading
      graphsToQueue.forEach((graphId) => queueGraphForLoading(graphId));

      return visibleGraphs;
    },
    [
      shouldRenderGraph,
      finalConfig.enableLazyLoading,
      isGraphRendered,
      isGraphLoading,
      queueGraphForLoading,
    ]
  );

  // Preload adjacent graphs
  const preloadAdjacentGraphs = useCallback(
    (
      graphs: Graph[],
      currentGraphId: string,
      viewport: {
        x: number;
        y: number;
        width: number;
        height: number;
        zoom: number;
      }
    ) => {
      if (!finalConfig.preloadAdjacentGraphs) return;

      const currentIndex = graphs.findIndex((g) => g.id === currentGraphId);
      if (currentIndex === -1) return;

      // Preload graphs around current position
      const preloadRange = 2;
      const startIndex = Math.max(0, currentIndex - preloadRange);
      const endIndex = Math.min(graphs.length - 1, currentIndex + preloadRange);

      for (let i = startIndex; i <= endIndex; i++) {
        const graph = graphs[i];
        if (
          graph.id !== currentGraphId &&
          !isGraphRendered(graph.id) &&
          !isGraphLoading(graph.id)
        ) {
          queueGraphForLoading(graph.id);
        }
      }
    },
    [
      finalConfig.preloadAdjacentGraphs,
      isGraphRendered,
      isGraphLoading,
      queueGraphForLoading,
    ]
  );

  // Clear cache for specific graph
  const clearGraphCache = useCallback((graphId: string) => {
    cacheRef.current.rendered.delete(graphId);
    cacheRef.current.loading.delete(graphId);
    cacheRef.current.error.delete(graphId);
  }, []);

  // Clear all cache
  const clearAllCache = useCallback(() => {
    cacheRef.current.rendered.clear();
    cacheRef.current.loading.clear();
    cacheRef.current.error.clear();
    setLoadingQueue([]);
    setActiveLoads(new Set());
  }, []);

  // Get optimization statistics
  const getOptimizationStats = useCallback(() => {
    return {
      rendered: cacheRef.current.rendered.size,
      loading: cacheRef.current.loading.size,
      errors: cacheRef.current.error.size,
      queued: loadingQueue.length,
      active: activeLoads.size,
    };
  }, [loadingQueue.length, activeLoads.size]);

  return {
    // Graph rendering optimization
    shouldRenderGraph,
    isGraphRendered,
    isGraphLoading,
    getGraphError,
    optimizeGraphsForViewport,
    preloadAdjacentGraphs,

    // Cache management
    markGraphRendered,
    markGraphLoading,
    markGraphError,
    clearGraphCache,
    clearAllCache,

    // Statistics
    getOptimizationStats,

    // Configuration
    config: finalConfig,
  };
}
