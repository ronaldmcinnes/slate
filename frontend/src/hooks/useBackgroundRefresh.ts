import { useEffect, useCallback } from "react";
import { useOptimizedData } from "./useOptimizedData";

interface UseBackgroundRefreshProps {
  selectedNotebook: { id: string } | null;
  onPagesUpdated?: (pages: any[]) => void;
  onNotebooksUpdated?: (notebooks: any[]) => void;
}

export function useBackgroundRefresh({
  selectedNotebook,
  onPagesUpdated,
  onNotebooksUpdated,
}: UseBackgroundRefreshProps) {
  const { getPagesForNotebook, getNotebooks, invalidateCache } =
    useOptimizedData();

  const refreshPages = useCallback(async () => {
    if (selectedNotebook && onPagesUpdated) {
      try {
        const pages = await getPagesForNotebook(selectedNotebook.id, true);
        onPagesUpdated(pages);
      } catch (error) {
        console.error("Background refresh failed for pages:", error);
      }
    }
  }, [selectedNotebook, onPagesUpdated, getPagesForNotebook]);

  const refreshNotebooks = useCallback(async () => {
    if (onNotebooksUpdated) {
      try {
        const notebooks = await getNotebooks(true);
        onNotebooksUpdated(notebooks);
      } catch (error) {
        console.error("Background refresh failed for notebooks:", error);
      }
    }
  }, [onNotebooksUpdated, getNotebooks]);

  // Set up periodic background refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPages();
      refreshNotebooks();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshPages, refreshNotebooks]);

  // Refresh when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      refreshPages();
      refreshNotebooks();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshPages, refreshNotebooks]);

  return {
    refreshPages,
    refreshNotebooks,
    invalidateCache,
  };
}
