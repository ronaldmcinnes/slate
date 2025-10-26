// API client for backend communication
import type {
  User,
  Notebook,
  Page,
  CreateNotebookRequest,
  UpdateNotebookRequest,
  ShareNotebookRequest,
  CreatePageRequest,
  UpdatePageRequest,
  SharePageRequest,
  UpdateCanvasStateRequest,
  SearchQuery,
  SearchResult,
  TrashItem,
  PageShareInvitation,
  SharedPage,
  ApiResponse,
} from "@shared/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem("auth_token");
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include", // Include cookies
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  // ============================================
  // AUTH
  // ============================================
  async getCurrentUser(): Promise<User> {
    const response = await this.request<User>("/api/auth/me");
    return response.data!;
  }

  async logout(): Promise<void> {
    await this.request("/api/auth/logout", { method: "POST" });
    this.clearToken();
  }

  async updateSettings(settings: {
    theme?: "light" | "dark" | "system";
    defaultNotebook?: string;
    displayName?: string;
    tutorialCompleted?: boolean;
  }): Promise<any> {
    const response = await this.request("/api/auth/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
    return response.data;
  }

  async updateCanvasState(canvasState: UpdateCanvasStateRequest): Promise<any> {
    const response = await this.request("/api/auth/canvas-state", {
      method: "PATCH",
      body: JSON.stringify(canvasState),
    });
    return response.data;
  }

  getGoogleLoginUrl(): string {
    return `${API_URL}/api/auth/google`;
  }

  // ============================================
  // NOTEBOOKS
  // ============================================
  async getNotebooks(): Promise<{ owned: Notebook[]; shared: Notebook[] }> {
    const response = await this.request<{
      owned: Notebook[];
      shared: Notebook[];
    }>("/api/notebooks");
    return response.data!;
  }

  async getNotebook(id: string): Promise<Notebook> {
    const response = await this.request<Notebook>(`/api/notebooks/${id}`);
    return response.data!;
  }

  async createNotebook(data: CreateNotebookRequest): Promise<Notebook> {
    const response = await this.request<Notebook>("/api/notebooks", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async updateNotebook(
    id: string,
    data: UpdateNotebookRequest
  ): Promise<Notebook> {
    const response = await this.request<Notebook>(`/api/notebooks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async deleteNotebook(id: string): Promise<void> {
    await this.request(`/api/notebooks/${id}`, { method: "DELETE" });
  }

  async restoreNotebook(id: string): Promise<Notebook> {
    const response = await this.request<Notebook>(
      `/api/notebooks/${id}/restore`,
      {
        method: "POST",
      }
    );
    return response.data!;
  }

  async shareNotebook(id: string, data: ShareNotebookRequest): Promise<any> {
    const response = await this.request(`/api/notebooks/${id}/share`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async unshareNotebook(id: string, userId: string): Promise<void> {
    await this.request(`/api/notebooks/${id}/share/${userId}`, {
      method: "DELETE",
    });
  }

  async getNotebookTags(): Promise<string[]> {
    const response = await this.request<string[]>("/api/notebooks/tags/list");
    return response.data!;
  }

  // ============================================
  // PAGES
  // ============================================
  async getPages(notebookId: string): Promise<Page[]> {
    const response = await this.request<Page[]>(
      `/api/pages/notebook/${notebookId}`
    );
    return response.data!;
  }

  async getPage(id: string): Promise<Page> {
    const response = await this.request<Page>(`/api/pages/${id}`);
    return response.data!;
  }

  async createPage(notebookId: string, data: CreatePageRequest): Promise<Page> {
    const response = await this.request<Page>(
      `/api/pages/notebook/${notebookId}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  }

  async updatePage(id: string, data: UpdatePageRequest): Promise<Page> {
    const response = await this.request<Page>(`/api/pages/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async deletePage(id: string): Promise<void> {
    await this.request(`/api/pages/${id}`, { method: "DELETE" });
  }

  async restorePage(id: string): Promise<Page> {
    const response = await this.request<Page>(`/api/pages/${id}/restore`, {
      method: "POST",
    });
    return response.data!;
  }

  async getRecentPages(): Promise<Page[]> {
    const response = await this.request<Page[]>("/api/pages/recent/list");
    return response.data!;
  }

  // ============================================
  // SEARCH
  // ============================================
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const params = new URLSearchParams();
    params.append("q", query.query);
    if (query.notebookId) params.append("notebookId", query.notebookId);
    if (query.tags) query.tags.forEach((tag) => params.append("tags", tag));
    if (query.limit) params.append("limit", query.limit.toString());

    const response = await this.request<SearchResult[]>(
      `/api/search?${params}`
    );
    return response.data!;
  }

  async searchNotebooks(query: string, tags?: string[]): Promise<any[]> {
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (tags) tags.forEach((tag) => params.append("tags", tag));

    const response = await this.request<any[]>(
      `/api/search/notebooks?${params}`
    );
    return response.data!;
  }

  // ============================================
  // TRASH
  // ============================================
  async getTrash(): Promise<TrashItem[]> {
    const response = await this.request<TrashItem[]>("/api/trash");
    return response.data!;
  }

  async permanentlyDelete(id: string): Promise<void> {
    await this.request(`/api/trash/${id}`, { method: "DELETE" });
  }

  async emptyTrash(): Promise<void> {
    await this.request("/api/trash/empty/all", { method: "DELETE" });
  }

  // ============================================
  // AGGREGATION
  // ============================================
  async getUserWithNotebooksAndPages(): Promise<any> {
    const response = await this.request<any>("/api/aggregate/user/full");
    return response.data;
  }

  async getUserStats(): Promise<{
    totalNotebooks: number;
    totalPages: number;
    totalWordCount: number;
    lastModified: string | null;
  }> {
    const response = await this.request<any>("/api/aggregate/stats");
    return response.data;
  }

  // ============================================
  // PAGE SHARING
  // ============================================
  async sharePage(pageId: string, data: SharePageRequest): Promise<any> {
    const response = await this.request(`/api/page-shares/${pageId}/share`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getSharedPages(): Promise<SharedPage[]> {
    const response = await this.request<SharedPage[]>("/api/page-shares/shared");
    return response.data!;
  }

  async getPageShareInvitations(): Promise<PageShareInvitation[]> {
    const response = await this.request<PageShareInvitation[]>("/api/page-shares/invitations");
    return response.data!;
  }

  async acceptPageShare(shareId: string): Promise<any> {
    const response = await this.request(`/api/page-shares/${shareId}/accept`, {
      method: "POST",
    });
    return response.data;
  }

  async declinePageShare(shareId: string): Promise<void> {
    await this.request(`/api/page-shares/${shareId}/decline`, {
      method: "POST",
    });
  }

  async getPageShareStatus(pageId: string): Promise<any[]> {
    const response = await this.request<any[]>(`/api/page-shares/${pageId}/share-status`);
    return response.data!;
  }

  async revokePageShare(shareId: string): Promise<void> {
    await this.request(`/api/page-shares/${shareId}`, {
      method: "DELETE",
    });
  }

  async getInvitationByToken(token: string): Promise<any> {
    const response = await this.request(`/api/page-shares/invitation/${token}`);
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiClient();
