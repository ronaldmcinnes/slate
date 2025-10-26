import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import type { UpdateCanvasStateRequest } from "@shared/types";

export interface CanvasState {
  // Current selection state
  currentNotebookId: string | null;
  currentPageId: string | null;

  // Last accessed pages per notebook
  lastAccessedPages: Record<string, string>; // notebookId -> pageId

  // Last accessed notebook
  lastAccessedNotebook: string | null;

  // UI state
  expandedPanels: {
    sidebar: boolean;
    pagesList: boolean;
    toolbar: boolean;
  };

  // Column widths
  columnWidths: {
    sidebar: number;
    pagesList: number;
  };

  // Canvas viewport state
  canvasViewport: {
    x: number;
    y: number;
    zoom: number;
  };

  // Tool state
  lastUsedTool: string;
  strokeColor: string;
  strokeWidth: number;

  // Canvas size
  canvasSize: {
    width: number;
    height: number;
  };

  // Toolbar state
  toolbarScrollPosition: number;
  isToolbarVisible: boolean;

  // Visible tools
  visibleTools: {
    eraser: boolean;
    markers: boolean;
    highlighter: boolean;
    fountainPen: boolean;
    text: boolean;
    graph: boolean;
    microphone: boolean;
  };
}

const DEFAULT_CANVAS_STATE: CanvasState = {
  currentNotebookId: null,
  currentPageId: null,
  lastAccessedPages: {},
  lastAccessedNotebook: null,
  expandedPanels: {
    sidebar: true,
    pagesList: true,
    toolbar: true,
  },
  columnWidths: {
    sidebar: 256,
    pagesList: 224,
  },
  canvasViewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
  lastUsedTool: "marker",
  strokeColor: "#000000",
  strokeWidth: 3,
  canvasSize: {
    width: 200,
    height: 200,
  },
  toolbarScrollPosition: 0,
  isToolbarVisible: true,
  visibleTools: {
    eraser: true,
    markers: true,
    highlighter: true,
    fountainPen: true,
    text: true,
    graph: true,
    microphone: true,
  },
};

export function useCanvasState() {
  const { user, updateCanvasState } = useAuth();
  const [state, setState] = useState<CanvasState>(DEFAULT_CANVAS_STATE);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef<boolean>(false);
  const lastAccessedPagesRef = useRef<Record<string, string>>({});
  const currentNotebookIdRef = useRef<string | null>(null);

  // Initialize state from user's saved canvas state
  useEffect(() => {
    // Only initialize once and never again - use early return to prevent any execution
    if (initializationRef.current) {
      return;
    }

    if (user?.canvasState) {
      const savedState = user.canvasState;
      setState((prevState) => {
        // Don't reset lastAccessedPages if it already has data
        const preservedLastAccessedPages =
          prevState.lastAccessedPages &&
          Object.keys(prevState.lastAccessedPages).length > 0
            ? prevState.lastAccessedPages
            : savedState.lastAccessedPages || {};

        // Store in ref for persistent access
        lastAccessedPagesRef.current = preservedLastAccessedPages;
        currentNotebookIdRef.current = savedState.currentNotebookId || null;

        return {
          ...prevState,
          currentNotebookId: savedState.currentNotebookId || null,
          currentPageId: savedState.currentPageId || null,
          lastAccessedPages: preservedLastAccessedPages,
          lastAccessedNotebook: savedState.lastAccessedNotebook || null,
          expandedPanels: {
            ...prevState.expandedPanels,
            ...savedState.expandedPanels,
          },
          columnWidths: {
            ...prevState.columnWidths,
            ...(savedState.columnWidths || {}),
          },
          canvasViewport: {
            ...prevState.canvasViewport,
            ...savedState.canvasViewport,
          },
          lastUsedTool: savedState.lastUsedTool || prevState.lastUsedTool,
        };
      });
      setIsInitialized(true);
      initializationRef.current = true;
    }
  }, [user?.id]); // Only depend on user.id, use ref to prevent multiple initializations

  // Update state and persist to server
  const updateState = useCallback(
    async (updates: Partial<CanvasState>) => {
      setState((prevState) => {
        // Prevent lastAccessedPages from being reset to empty object
        const safeUpdates = { ...updates };
        if (updates.lastAccessedPages !== undefined) {
          if (
            Object.keys(updates.lastAccessedPages).length === 0 &&
            Object.keys(prevState.lastAccessedPages).length > 0
          ) {
            delete safeUpdates.lastAccessedPages;
          } else if (Object.keys(updates.lastAccessedPages).length > 0) {
          }
        }

        const newState = { ...prevState, ...safeUpdates };

        // Persist to server (debounced)
        const persistUpdates: UpdateCanvasStateRequest = {};

        if (updates.currentNotebookId !== undefined) {
          persistUpdates.currentNotebookId =
            updates.currentNotebookId || undefined;
        }
        if (updates.currentPageId !== undefined) {
          persistUpdates.currentPageId = updates.currentPageId || undefined;
        }
        if (updates.lastAccessedPages !== undefined) {
          // Don't persist empty lastAccessedPages if we already have data
          if (
            Object.keys(updates.lastAccessedPages).length > 0 ||
            Object.keys(prevState.lastAccessedPages).length === 0
          ) {
            persistUpdates.lastAccessedPages = updates.lastAccessedPages;
          }
        }
        if (updates.expandedPanels) {
          persistUpdates.expandedPanels = updates.expandedPanels;
        }
        if (updates.canvasViewport) {
          persistUpdates.canvasViewport = updates.canvasViewport;
        }
        if (updates.lastUsedTool !== undefined) {
          persistUpdates.lastUsedTool = updates.lastUsedTool;
        }

        // Only persist if there are actual changes to save
        if (Object.keys(persistUpdates).length > 0) {
          updateCanvasState(persistUpdates).catch(console.error);
        }

        return newState;
      });
    },
    [updateCanvasState]
  );

  // Specific update functions for common operations
  const setCurrentNotebook = useCallback(
    (notebookId: string | null) => {
      updateState({ currentNotebookId: notebookId });
    },
    [updateState]
  );

  const setCurrentPage = useCallback(
    (pageId: string | null) => {
      updateState({ currentPageId: pageId });
    },
    [updateState]
  );

  const setLastAccessedPage = useCallback(
    (notebookId: string, pageId: string) => {
      console.log(
        `💾 Setting last accessed page for notebook ${notebookId} to page ${pageId}`
      );
      const newLastAccessedPages = {
        ...state.lastAccessedPages,
        [notebookId]: pageId,
      };

      // Update ref for persistent access
      lastAccessedPagesRef.current = newLastAccessedPages;
      console.log(
        "💾 Updated lastAccessedPages in ref:",
        lastAccessedPagesRef.current
      );

      updateState({
        lastAccessedPages: newLastAccessedPages,
      });
    },
    [updateState]
  );

  const setLastAccessedNotebook = useCallback(
    (notebookId: string) => {
      console.log(`💾 Setting last accessed notebook to ${notebookId}`);
      updateState({
        lastAccessedNotebook: notebookId,
      });
    },
    [updateState]
  );

  const getCurrentNotebookId = useCallback((): string | null => {
    // Try state first, then fallback to lastAccessedNotebook
    let notebookId = state.currentNotebookId;

    if (!notebookId && state.lastAccessedNotebook) {
      console.log("🔄 Using lastAccessedNotebook fallback");
      notebookId = state.lastAccessedNotebook;
    }

    console.log(`🔍 Getting current notebook ID:`, notebookId);
    console.log(`📊 State currentNotebookId:`, state.currentNotebookId);
    console.log(`📊 State lastAccessedNotebook:`, state.lastAccessedNotebook);

    return notebookId;
  }, [state.currentNotebookId, state.lastAccessedNotebook]);

  const getLastAccessedPage = useCallback(
    (notebookId: string): string | null => {
      // Try state first, then fallback to ref
      let pageId = state.lastAccessedPages[notebookId] || null;

      // If state is empty but ref has data, use ref
      if (
        !pageId &&
        Object.keys(state.lastAccessedPages).length === 0 &&
        Object.keys(lastAccessedPagesRef.current).length > 0
      ) {
        pageId = lastAccessedPagesRef.current[notebookId] || null;
      }

      // Additional fallback: if we have currentPageId in state, use that for the current notebook
      if (
        !pageId &&
        state.currentNotebookId === notebookId &&
        state.currentPageId
      ) {
        pageId = state.currentPageId;
      }

      // If we have no data but should have data, log a warning
      if (
        !pageId &&
        Object.keys(state.lastAccessedPages).length === 0 &&
        Object.keys(lastAccessedPagesRef.current).length === 0
      ) {
        console.warn(
          "⚠️ lastAccessedPages is empty in both state and ref - this might indicate a state reset issue"
        );
      }

      return pageId;
    },
    [state.lastAccessedPages]
  );

  const setExpandedPanel = useCallback(
    (panel: keyof CanvasState["expandedPanels"], expanded: boolean) => {
      updateState({
        expandedPanels: {
          ...state.expandedPanels,
          [panel]: expanded,
        },
      });
    },
    [updateState]
  );

  const setColumnWidth = useCallback(
    (column: keyof CanvasState["columnWidths"], width: number) => {
      updateState({
        columnWidths: {
          ...state.columnWidths,
          [column]: width,
        },
      });
    },
    [updateState]
  );

  const setCanvasViewport = useCallback(
    (viewport: Partial<CanvasState["canvasViewport"]>) => {
      updateState({
        canvasViewport: {
          ...state.canvasViewport,
          ...viewport,
        },
      });
    },
    [updateState]
  );

  const setLastUsedTool = useCallback(
    (tool: string) => {
      updateState({ lastUsedTool: tool });
    },
    [updateState]
  );

  const setStrokeColor = useCallback(
    (color: string) => {
      updateState({ strokeColor: color });
    },
    [updateState]
  );

  const setStrokeWidth = useCallback(
    (width: number) => {
      updateState({ strokeWidth: width });
    },
    [updateState]
  );

  const setCanvasSize = useCallback(
    (size: CanvasState["canvasSize"]) => {
      updateState({ canvasSize: size });
    },
    [updateState]
  );

  const setToolbarScrollPosition = useCallback(
    (position: number) => {
      updateState({ toolbarScrollPosition: position });
    },
    [updateState]
  );

  const setIsToolbarVisible = useCallback(
    (visible: boolean) => {
      updateState({ isToolbarVisible: visible });
    },
    [updateState]
  );

  const setVisibleTools = useCallback(
    (tools: CanvasState["visibleTools"]) => {
      updateState({ visibleTools: tools });
    },
    [updateState]
  );

  // Reset to default state
  const resetState = useCallback(() => {
    setState(DEFAULT_CANVAS_STATE);
    updateCanvasState({
      currentNotebookId: null,
      currentPageId: null,
      expandedPanels: DEFAULT_CANVAS_STATE.expandedPanels,
      columnWidths: DEFAULT_CANVAS_STATE.columnWidths,
      canvasViewport: DEFAULT_CANVAS_STATE.canvasViewport,
      lastUsedTool: DEFAULT_CANVAS_STATE.lastUsedTool,
    }).catch(console.error);
  }, [updateCanvasState]);

  return {
    state,
    isInitialized,
    updateState,
    setCurrentNotebook,
    setCurrentPage,
    setLastAccessedPage,
    setLastAccessedNotebook,
    getLastAccessedPage,
    getCurrentNotebookId,
    setExpandedPanel,
    setColumnWidth,
    setCanvasViewport,
    setLastUsedTool,
    setStrokeColor,
    setStrokeWidth,
    setCanvasSize,
    setToolbarScrollPosition,
    setIsToolbarVisible,
    setVisibleTools,
    resetState,
  };
}
