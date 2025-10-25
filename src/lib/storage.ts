// Local storage utilities for notebooks and pages
import type { Notebook, Page } from '../types';

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

export const createNotebook = (title: string): Notebook => {
  const notebooks = getNotebooks();
  const newNotebook: Notebook = {
    id: Date.now(),
    title,
    pages: [],
    createdAt: new Date().toISOString(),
  };
  notebooks.push(newNotebook);
  saveNotebooks(notebooks);
  return newNotebook;
};

export const createPage = (notebookId: number, title: string): Page | null => {
  const notebooks = getNotebooks();
  const notebook = notebooks.find((n) => n.id === notebookId);
  if (notebook) {
    const newPage: Page = {
      id: Date.now(),
      title,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      content: "",
      drawings: null,
      graphs: [],
      textBoxes: [],
    };
    notebook.pages.push(newPage);
    saveNotebooks(notebooks);
    return newPage;
  }
  return null;
};

export const updatePage = (notebookId: number, pageId: number, updates: Partial<Page>): Page | null => {
  const notebooks = getNotebooks();
  const notebook = notebooks.find((n) => n.id === notebookId);
  if (notebook) {
    const page = notebook.pages.find((p) => p.id === pageId);
    if (page) {
      Object.assign(page, updates, { lastModified: new Date().toISOString() });
      saveNotebooks(notebooks);
      return page;
    }
  }
  return null;
};

export const deleteNotebook = (notebookId: number): void => {
  let notebooks = getNotebooks();
  notebooks = notebooks.filter((n) => n.id !== notebookId);
  saveNotebooks(notebooks);
};

export const deletePage = (notebookId: number, pageId: number): void => {
  const notebooks = getNotebooks();
  const notebook = notebooks.find((n) => n.id === notebookId);
  if (notebook) {
    notebook.pages = notebook.pages.filter((p) => p.id !== pageId);
    saveNotebooks(notebooks);
  }
};
