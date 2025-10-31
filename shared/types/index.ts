// Shared types between frontend and backend

/**
 * Request type for updating canvas state
 */
export interface UpdateCanvasStateRequest {
  currentNotebookId?: string | null;
  currentPageId?: string | null;
  lastAccessedPages?: Record<string, string>;
  lastAccessedNotebook?: string | null;
  expandedPanels?: {
    sidebar?: boolean;
    pagesList?: boolean;
    toolbar?: boolean;
  };
  columnWidths?: {
    sidebar?: number;
    pagesList?: number;
  };
  canvasViewport?: {
    x?: number;
    y?: number;
    zoom?: number;
  };
  lastUsedTool?: string;
}

// Re-export other commonly used types for consistency
export interface User {
  id: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  createdAt: string;
  lastLogin: string;
  tutorialCompleted: boolean;
  settings: {
    theme?: "light" | "dark" | "system";
    defaultNotebook?: string;
  };
  canvasState: {
    expandedPanels: {
      sidebar: boolean;
      pagesList: boolean;
      toolbar: boolean;
    };
    columnWidths?: {
      sidebar: number;
      pagesList: number;
    };
    currentNotebookId?: string | null;
    currentPageId?: string | null;
    lastAccessedPages: Record<string, string>;
    lastAccessedNotebook?: string | null;
    canvasViewport: {
      x: number;
      y: number;
      zoom: number;
    };
    lastUsedTool?: string;
  };
  recentPages: Array<{
    pageId: string;
    notebookId: string;
    accessedAt: string;
  }>;
  isActive: boolean;
}

export interface Notebook {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface Page {
  id: string;
  notebookId: string;
  title: string;
  content: string;
  drawings: any | null;
  graphs: any[];
  textBoxes: any[];
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

export interface CreateNotebookRequest {
  title: string;
}

export interface UpdateNotebookRequest {
  title?: string;
}

export interface ShareNotebookRequest {
  email: string;
  permission: "view" | "edit";
}

export interface CreatePageRequest {
  title: string;
  content?: string;
}

export interface UpdatePageRequest {
  title?: string;
  content?: string;
  drawings?: any;
  graphs?: any[];
  textBoxes?: any[];
}

export interface SearchQuery {
  query: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  page: Page;
  notebook: Notebook;
  score: number;
}

export interface TrashItem {
  id: string;
  type: "notebook" | "page";
  title: string;
  deletedAt: string;
  notebookId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
