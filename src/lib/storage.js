// Local storage utilities for notebooks and pages

const STORAGE_KEY = "slate_notebooks";

export const getNotebooks = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Return empty array if no data
  return [];
};

export const saveNotebooks = (notebooks) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notebooks));
};

export const createNotebook = (title) => {
  const notebooks = getNotebooks();
  const newNotebook = {
    id: Date.now(),
    title,
    pages: [],
    createdAt: new Date().toISOString(),
  };
  notebooks.push(newNotebook);
  saveNotebooks(notebooks);
  return newNotebook;
};

export const createPage = (notebookId, title) => {
  const notebooks = getNotebooks();
  const notebook = notebooks.find((n) => n.id === notebookId);
  if (notebook) {
    const newPage = {
      id: Date.now(),
      title,
      lastModified: new Date().toISOString(),
      content: "",
      drawings: null,
      graphs: [],
    };
    notebook.pages.push(newPage);
    saveNotebooks(notebooks);
    return newPage;
  }
  return null;
};

export const updatePage = (notebookId, pageId, updates) => {
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

export const deleteNotebook = (notebookId) => {
  let notebooks = getNotebooks();
  notebooks = notebooks.filter((n) => n.id !== notebookId);
  saveNotebooks(notebooks);
};

export const deletePage = (notebookId, pageId) => {
  const notebooks = getNotebooks();
  const notebook = notebooks.find((n) => n.id === notebookId);
  if (notebook) {
    notebook.pages = notebook.pages.filter((p) => p.id !== pageId);
    saveNotebooks(notebooks);
  }
};
