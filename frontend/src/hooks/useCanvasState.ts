import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import type { UpdateCanvasStateRequest } from "@shared/types";

export interface CanvasState {
  // Current selection state
  currentNotebookId: string | null;
  currentPageId: string | null;

  // Last accessed pages per notebook
  lastAccessedPages: Record<string, string>; // notebookId -> pageId

  // UI state
  expandedPanels: {
    sidebar: boolean;
    pagesList: boolean;
    toolbar: boolean;
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
  expandedPanels: {
    sidebar: true,
    pagesList: true,
    toolbar: true,
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

  // Initialize state from user's saved canvas state
  useEffect(() => {
    if (user?.canvasState && !isInitialized) {
      const savedState = user.canvasState;
      setState((prevState) => ({
        ...prevState,
        currentNotebookId: savedState.currentNotebookId || null,
        currentPageId: savedState.currentPageId || null,
        lastAccessedPages: savedState.lastAccessedPages || {},
        expandedPanels: {
          ...prevState.expandedPanels,
          ...savedState.expandedPanels,
        },
        canvasViewport: {
          ...prevState.canvasViewport,
          ...savedState.canvasViewport,
        },
        lastUsedTool: savedState.lastUsedTool || prevState.lastUsedTool,
      }));
      setIsInitialized(true);
    }
  }, [user?.canvasState, isInitialized]);

  // Update state and persist to server
  const updateState = useCallback(
    async (updates: Partial<CanvasState>) => {
      setState((prevState) => {
        const newState = { ...prevState, ...updates };

        // Persist to server (debounced)
        const persistUpdates: UpdateCanvasStateRequest = {};

        if (updates.currentNotebookId !== undefined) {
          persistUpdates.currentNotebookId = updates.currentNotebookId;
        }
        if (updates.currentPageId !== undefined) {
          persistUpdates.currentPageId = updates.currentPageId;
        }
        if (updates.lastAccessedPages !== undefined) {
          persistUpdates.lastAccessedPages = updates.lastAccessedPages;
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
      updateState({
        lastAccessedPages: {
          ...state.lastAccessedPages,
          [notebookId]: pageId,
        },
      });
    },
    [updateState, state.lastAccessedPages]
  );

  const getLastAccessedPage = useCallback(
    (notebookId: string): string | null => {
      return state.lastAccessedPages[notebookId] || null;
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
    [updateState, state.expandedPanels]
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
    [updateState, state.canvasViewport]
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
    getLastAccessedPage,
    setExpandedPanel,
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
