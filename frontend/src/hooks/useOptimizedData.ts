import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import type { Notebook, Page as SharedPage } from "@shared/types";
import type { Page } from "@/types";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface DataCache {
  notebooks: Map<string, CacheEntry<Notebook>>;
  pages: Map<string, CacheEntry<Page>>;
  pageLists: Map<string, CacheEntry<Page[]>>;
}

interface PreloadConfig {
  enabled: boolean;
  maxCacheSize: number;
  defaultTTL: number;
  preloadAdjacentPages: boolean;
}

const DEFAULT_CONFIG: PreloadConfig = {
  enabled: true,
  maxCacheSize: 200, // Increased cache size for better performance
  defaultTTL: 10 * 60 * 1000, // 10 minutes - longer TTL for better caching
  preloadAdjacentPages: true,
};

export function useOptimizedData(config: Partial<PreloadConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const cacheRef = useRef<DataCache>({
    notebooks: new Map(),
    pages: new Map(),
    pageLists: new Map(),
  });

  const [loadingStates, setLoadingStates] = useState({
    notebooks: false,
    pages: false,
    page: false,
  });

  // Cache management utilities
  const isExpired = useCallback((entry: CacheEntry<any>): boolean => {
    return Date.now() - entry.timestamp > entry.ttl;
  }, []);

  const cleanupCache = useCallback(
    (cache: Map<string, CacheEntry<any>>) => {
      if (cache.size > finalConfig.maxCacheSize) {
        const entries = Array.from(cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

        // Remove oldest entries
        const toRemove = entries.slice(
          0,
          cache.size - finalConfig.maxCacheSize
        );
        toRemove.forEach(([key]) => cache.delete(key));
      }
    },
    [finalConfig.maxCacheSize]
  );

  const getFromCache = useCallback(
    <T>(cache: Map<string, CacheEntry<T>>, key: string): T | null => {
      const entry = cache.get(key);
      if (!entry || isExpired(entry)) {
        cache.delete(key);
        return null;
      }
      return entry.data;
    },
    [isExpired]
  );

  const setCache = useCallback(
    <T>(
      cache: Map<string, CacheEntry<T>>,
      key: string,
      data: T,
      ttl?: number
    ) => {
      cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: ttl || finalConfig.defaultTTL,
      });
      cleanupCache(cache);
    },
    [finalConfig.defaultTTL, cleanupCache]
  );

  // Convert shared page to frontend page type
  const convertPageToFrontendType = useCallback(
    (sharedPage: SharedPage): Page => {
      return {
        id: sharedPage.id,
        title: sharedPage.title,
        createdAt: sharedPage.createdAt,
        lastModified: sharedPage.lastModified,
        content: sharedPage.content,
        drawings: sharedPage.drawings,
        graphs: sharedPage.graphs,
        textBoxes: sharedPage.textBoxes,
      };
    },
    []
  );

  // Optimized notebooks fetching
  const getNotebooks = useCallback(
    async (
      forceRefresh = false
    ): Promise<{ owned: Notebook[]; shared: Notebook[] }> => {
      const cacheKey = "all_notebooks";

      if (!forceRefresh) {
        const cached = getFromCache(cacheRef.current.notebooks, cacheKey);
        if (cached) {
          return cached as any;
        }
      }

      setLoadingStates((prev) => ({ ...prev, notebooks: true }));

      try {
        const result = await api.getNotebooks();
        setCache(
          cacheRef.current.notebooks,
          cacheKey,
          result,
          finalConfig.defaultTTL
        );
        return result;
      } finally {
        setLoadingStates((prev) => ({ ...prev, notebooks: false }));
      }
    },
    [getFromCache, setCache, finalConfig.defaultTTL]
  );

  // Preload adjacent pages for smoother navigation
  const preloadAdjacentPages = useCallback(
    async (pages: Page[], notebookId: string) => {
      if (!finalConfig.preloadAdjacentPages) return;

      // Preload first 3 pages and last 3 pages
      const pagesToPreload = [...pages.slice(0, 3), ...pages.slice(-3)].filter(
        (page) => !getFromCache(cacheRef.current.pages, page.id)
      );

      if (pagesToPreload.length === 0) return;

      // Use bulk endpoint for better performance
      try {
        const pageIds = pagesToPreload.map((page) => page.id);
        const bulkPages = await api.getPagesBulk(pageIds);

        // Cache the preloaded pages
        bulkPages.forEach((page) => {
          const convertedPage = convertPageToFrontendType(page);
          setCache(
            cacheRef.current.pages,
            page.id,
            convertedPage,
            finalConfig.defaultTTL
          );
        });
      } catch (error) {
        console.error("Failed to preload pages:", error);
        // Don't fallback to getPage to avoid circular dependency
      }
    },
    [
      finalConfig.preloadAdjacentPages,
      getFromCache,
      convertPageToFrontendType,
      setCache,
      finalConfig.defaultTTL,
    ]
  );

  // Optimized pages list fetching
  const getPagesForNotebook = useCallback(
    async (notebookId: string, forceRefresh = false): Promise<Page[]> => {
      if (!forceRefresh) {
        const cached = getFromCache(cacheRef.current.pageLists, notebookId);
        if (cached) {
          // Even if we have cached page list, preload pages in background
          if (finalConfig.preloadAdjacentPages && cached.length > 0) {
            preloadAdjacentPages(cached, notebookId);
          }
          return cached;
        }
      }

      setLoadingStates((prev) => ({ ...prev, pages: true }));

      try {
        const sharedPages = await api.getPages(notebookId);
        const convertedPages = sharedPages.map(convertPageToFrontendType);

        // Cache the page list with longer TTL for better performance
        setCache(
          cacheRef.current.pageLists,
          notebookId,
          convertedPages,
          finalConfig.defaultTTL * 2 // Double TTL for page lists
        );

        // Preload adjacent pages if enabled
        if (finalConfig.preloadAdjacentPages && convertedPages.length > 0) {
          preloadAdjacentPages(convertedPages, notebookId);
        }

        return convertedPages;
      } finally {
        setLoadingStates((prev) => ({ ...prev, pages: false }));
      }
    },
    [
      getFromCache,
      setCache,
      convertPageToFrontendType,
      finalConfig.defaultTTL,
      finalConfig.preloadAdjacentPages,
      preloadAdjacentPages,
    ]
  );

  // Optimized single page fetching
  const getPage = useCallback(
    async (pageId: string, forceRefresh = false): Promise<Page | null> => {
      if (!forceRefresh) {
        const cached = getFromCache(cacheRef.current.pages, pageId);
        if (cached) {
          return cached;
        }
      }

      setLoadingStates((prev) => ({ ...prev, page: true }));

      try {
        const sharedPage = await api.getPage(pageId);
        const convertedPage = convertPageToFrontendType(sharedPage);

        // Cache the full page data
        setCache(
          cacheRef.current.pages,
          pageId,
          convertedPage,
          finalConfig.defaultTTL
        );

        return convertedPage;
      } catch (error) {
        console.error("Failed to load page:", error);
        return null;
      } finally {
        setLoadingStates((prev) => ({ ...prev, page: false }));
      }
    },
    [getFromCache, setCache, convertPageToFrontendType, finalConfig.defaultTTL]
  );

  // Preload all notebooks' page lists for instant switching
  const preloadAllNotebookPages = useCallback(
    async (notebooks: Notebook[]) => {
      if (!finalConfig.preloadAdjacentPages) return;

      // Preload page lists for all notebooks in background
      const preloadPromises = notebooks.map(async (notebook) => {
        try {
          // Check if already cached
          const cached = getFromCache(cacheRef.current.pageLists, notebook.id);
          if (cached) return; // Already cached, skip

          // Preload page list
          const sharedPages = await api.getPages(notebook.id);
          const convertedPages = sharedPages.map(convertPageToFrontendType);

          // Cache the page list
          setCache(
            cacheRef.current.pageLists,
            notebook.id,
            convertedPages,
            finalConfig.defaultTTL * 3 // Even longer TTL for preloaded data
          );

          // Also preload first few pages of each notebook
          if (convertedPages.length > 0) {
            const pagesToPreload = convertedPages.slice(0, 3); // First 3 pages for better UX
            const pageIds = pagesToPreload.map((page) => page.id);

            try {
              const bulkPages = await api.getPagesBulk(pageIds);
              bulkPages.forEach((page) => {
                const convertedPage = convertPageToFrontendType(page);
                setCache(
                  cacheRef.current.pages,
                  page.id,
                  convertedPage,
                  finalConfig.defaultTTL * 2
                );
              });
            } catch (error) {
              console.error(
                `Failed to preload pages for notebook ${notebook.id}:`,
                error
              );
            }
          }
        } catch (error) {
          console.error(`Failed to preload notebook ${notebook.id}:`, error);
        }
      });

      // Run all preloading in parallel but don't wait for completion
      Promise.allSettled(preloadPromises).catch(console.error);
    },
    [
      finalConfig.preloadAdjacentPages,
      getFromCache,
      convertPageToFrontendType,
      setCache,
      finalConfig.defaultTTL,
    ]
  );

  // Aggressively preload current notebook's pages
  const preloadCurrentNotebookPages = useCallback(
    async (notebookId: string) => {
      if (!finalConfig.preloadAdjacentPages) return;

      try {
        // Get all pages for the current notebook
        const sharedPages = await api.getPages(notebookId);
        const convertedPages = sharedPages.map(convertPageToFrontendType);

        // Cache the page list
        setCache(
          cacheRef.current.pageLists,
          notebookId,
          convertedPages,
          finalConfig.defaultTTL * 3
        );

        // Preload all pages of the current notebook for instant access
        if (convertedPages.length > 0) {
          const pageIds = convertedPages.map((page) => page.id);

          try {
            const bulkPages = await api.getPagesBulk(pageIds);
            bulkPages.forEach((page) => {
              const convertedPage = convertPageToFrontendType(page);
              setCache(
                cacheRef.current.pages,
                page.id,
                convertedPage,
                finalConfig.defaultTTL * 2
              );
            });
          } catch (error) {
            console.error(
              `Failed to preload all pages for notebook ${notebookId}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error(
          `Failed to preload current notebook ${notebookId}:`,
          error
        );
      }
    },
    [
      finalConfig.preloadAdjacentPages,
      convertPageToFrontendType,
      setCache,
      finalConfig.defaultTTL,
    ]
  );

  // Batch operations for better performance
  const batchUpdatePages = useCallback(
    async (updates: Array<{ id: string; updates: Partial<Page> }>) => {
      // This would be implemented with a batch API endpoint
      // For now, we'll update individually but optimize the cache updates
      const results = await Promise.allSettled(
        updates.map(({ id, updates: pageUpdates }) =>
          api.updatePage(id, pageUpdates)
        )
      );

      // Update cache for successful updates
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const { id } = updates[index];
          const convertedPage = convertPageToFrontendType(result.value);
          setCache(
            cacheRef.current.pages,
            id,
            convertedPage,
            finalConfig.defaultTTL
          );
        }
      });

      return results;
    },
    [convertPageToFrontendType, setCache, finalConfig.defaultTTL]
  );

  // Cache invalidation
  const invalidateCache = useCallback(
    (type: "notebooks" | "pages" | "pageLists", key?: string) => {
      if (key) {
        cacheRef.current[type].delete(key);
      } else {
        cacheRef.current[type].clear();
      }
    },
    []
  );

  // Update cache with new data (for smooth state updates)
  const updateCache = useCallback(
    (type: "notebooks" | "pages" | "pageLists", key: string, data: any) => {
      setCache(cacheRef.current[type], key, data, finalConfig.defaultTTL);
    },
    [setCache, finalConfig.defaultTTL]
  );

  const invalidateAllCache = useCallback(() => {
    cacheRef.current.notebooks.clear();
    cacheRef.current.pages.clear();
    cacheRef.current.pageLists.clear();
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return {
      notebooks: cacheRef.current.notebooks.size,
      pages: cacheRef.current.pages.size,
      pageLists: cacheRef.current.pageLists.size,
      total:
        cacheRef.current.notebooks.size +
        cacheRef.current.pages.size +
        cacheRef.current.pageLists.size,
    };
  }, []);

  // Cleanup expired entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      Object.values(cacheRef.current).forEach((cache) => {
        const keysToDelete: string[] = [];
        cache.forEach((entry, key) => {
          if (isExpired(entry)) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach((key) => cache.delete(key));
      });
    }, 60000); // Cleanup every minute

    return () => clearInterval(interval);
  }, [isExpired]);

  return {
    // Data fetching
    getNotebooks,
    getPagesForNotebook,
    getPage,
    batchUpdatePages,

    // Preloading
    preloadAllNotebookPages,
    preloadCurrentNotebookPages,
    preloadAdjacentPages,

    // Cache management
    invalidateCache,
    updateCache,
    invalidateAllCache,
    getCacheStats,

    // Loading states
    loadingStates,

    // Utilities
    convertPageToFrontendType,
  };
}
