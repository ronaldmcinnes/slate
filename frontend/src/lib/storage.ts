// Local storage utilities for notebooks and pages
import type { Notebook, Page } from "@shared/types";

const STORAGE_KEY = "slate_notebooks";

export const getNotebooks = (): Notebook[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Return empty array if no data
  return [];
};

export const saveNotebooks = (notebooks: Notebook[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notebooks));
};

export const createNotebook = (title: string, userId: string): Notebook => {
  const notebooks = getNotebooks();
  const newNotebook: Notebook = {
    id: Date.now().toString(),
    userId,
    title,
    description: "",
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    order: notebooks.length,
    color: "#3b82f6",
    icon: "📓",
    tags: [],
    isDeleted: false,
    sharedWith: [],
    isOwner: true,
    permission: "edit",
  };
  notebooks.push(newNotebook);
  saveNotebooks(notebooks);
  return newNotebook;
};

export const createPage = (
  notebookId: string,
  title: string,
  userId: string
): Page | null => {
  const notebooks = getNotebooks();
  const notebook = notebooks.find((n) => n.id === notebookId);
  if (notebook) {
    const newPage: Page = {
      id: Date.now().toString(),
      notebookId,
      userId,
      title,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      lastModifiedBy: userId,
      order: 0,
      content: "",
      drawings: null,
      graphs: [],
      textBoxes: [],
      isDeleted: false,
      tags: [],
    };
    // Note: Pages are not stored in notebooks in the shared types structure
    // They are separate entities with notebookId references
    saveNotebooks(notebooks);
    return newPage;
  }
  return null;
};

export const updatePage = (
  pageId: string,
  updates: Partial<Page>,
  userId: string
): Page | null => {
  // Note: In the shared types structure, pages are separate entities
  // This function would need to work with a separate pages storage
  // For now, we'll return null as this storage structure doesn't match the app architecture
  console.warn(
    "updatePage: This storage structure doesn't match the current app architecture"
  );
  return null;
};

export const deleteNotebook = (notebookId: string): void => {
  let notebooks = getNotebooks();
  notebooks = notebooks.filter((n) => n.id !== notebookId);
  saveNotebooks(notebooks);
};

export const deletePage = (pageId: string): void => {
  // Note: In the shared types structure, pages are separate entities
  // This function would need to work with a separate pages storage
  // For now, we'll just log a warning as this storage structure doesn't match the app architecture
  console.warn(
    "deletePage: This storage structure doesn't match the current app architecture"
  );
};
