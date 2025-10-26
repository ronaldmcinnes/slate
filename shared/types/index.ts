// Shared types between frontend and backend

// ============================================
// USER TYPES
// ============================================
export interface User {
  id: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  createdAt: string;
  lastLogin: string;
  tutorialCompleted: boolean;
  settings?: {
    theme?: "light" | "dark" | "system";
    defaultNotebook?: string;
  };
  canvasState?: {
    expandedPanels?: {
      sidebar?: boolean;
      pagesList?: boolean;
      toolbar?: boolean;
    };
    currentNotebookId?: string;
    currentPageId?: string;
    canvasViewport?: {
      x?: number;
      y?: number;
      zoom?: number;
    };
    lastUsedTool?: string;
  };
}

// ============================================
// NOTEBOOK TYPES
// ============================================
export interface Notebook {
  id: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: string;
  lastModified: string;
  order: number;
  color?: string;
  icon?: string;
  tags: string[];
  isDeleted: boolean;
  deletedAt?: string;
  sharedWith: SharedUser[];
  isOwner?: boolean; // Computed field - true if current user is owner
  permission?: "view" | "edit"; // Computed field - permission level for current user
}

export interface SharedUser {
  userId: string;
  email: string;
  displayName: string;
  permission: "view" | "edit";
  sharedAt: string;
  sharedBy: string;
}

// ============================================
// PAGE TYPES
// ============================================
export interface Page {
  id: string;
  notebookId: string;
  userId: string;
  title: string;
  createdAt: string;
  lastModified: string;
  lastModifiedBy: string;
  order: number;
  content: string;
  drawings: DrawingData | null;
  graphs: Graph[];
  textBoxes: TextBox[];
  isDeleted: boolean;
  deletedAt?: string;
  tags?: string[];
}

export interface Graph {
  id: string;
  type: string;
  data: any;
  layout?: any;
  config?: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface TextBox {
  id: string;
  text: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  fontSize: number;
  fontFamily: string;
  color: string;
}

export interface DrawingData {
  paths: any[];
  width: number;
  height: number;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================
export interface CreateNotebookRequest {
  title: string;
  description?: string;
  tags?: string[];
  color?: string;
  icon?: string;
}

export interface UpdateNotebookRequest {
  title?: string;
  description?: string;
  tags?: string[];
  color?: string;
  icon?: string;
  order?: number;
}

export interface ShareNotebookRequest {
  email: string;
  permission: "view" | "edit";
}

export interface CreatePageRequest {
  title: string;
  content?: string;
  tags?: string[];
}

export interface UpdatePageRequest {
  title?: string;
  content?: string;
  drawings?: DrawingData | null;
  graphs?: Graph[];
  textBoxes?: TextBox[];
  tags?: string[];
  order?: number;
}

export interface SharePageRequest {
  email: string;
  permission: "view" | "edit";
}

export interface UpdateCanvasStateRequest {
  expandedPanels?: {
    sidebar?: boolean;
    pagesList?: boolean;
    toolbar?: boolean;
  };
  currentNotebookId?: string;
  currentPageId?: string;
  canvasViewport?: {
    x?: number;
    y?: number;
    zoom?: number;
  };
  lastUsedTool?: string;
}

export interface SearchQuery {
  query: string;
  notebookId?: string;
  tags?: string[];
  limit?: number;
}

export interface SearchResult {
  type: "notebook" | "page";
  id: string;
  title: string;
  notebookTitle?: string;
  notebookId?: string;
  excerpt?: string;
  highlights?: string[];
  score: number;
}

// ============================================
// TRASH TYPES
// ============================================
export interface TrashItem {
  id: string;
  userId: string;
  itemType: "notebook" | "page";
  itemId: string;
  title: string;
  deletedAt: string;
  expiresAt: string;
}

// ============================================
// ACTIVITY TYPES
// ============================================
export interface Activity {
  id: string;
  userId: string;
  action: "create" | "update" | "delete" | "restore" | "share" | "unshare";
  targetType: "notebook" | "page";
  targetId: string;
  targetTitle: string;
  timestamp: string;
  collaboratorId?: string;
  collaboratorName?: string;
}

// ============================================
// API RESPONSE WRAPPER
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================
// PAGE SHARING TYPES
// ============================================
export interface PageShare {
  id: string;
  pageId: string;
  sharedBy: string;
  sharedWith: string;
  permission: "view" | "edit";
  status: "pending" | "accepted" | "declined" | "expired";
  invitationToken: string;
  expiresAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageShareInvitation {
  id: string;
  page: Page;
  sharedBy: User;
  permission: "view" | "edit";
  expiresAt: string;
  createdAt: string;
}

export interface SharedPage {
  id: string;
  page: Page;
  sharedBy: User;
  permission: "view" | "edit";
  acceptedAt: string;
}
