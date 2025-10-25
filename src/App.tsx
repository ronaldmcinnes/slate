import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import PagesList from "@/components/layout/PagesList";
import Canvas from "@/components/canvas/Canvas";
import ResizablePanel from "@/components/layout/ResizablePanel";
import RenamePageDialog from "@/components/dialogs/RenamePageDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import {
  getNotebooks,
  createNotebook,
  createPage,
  updatePage,
  deletePage as deletePageFromStorage,
} from "@/lib/storage";
import type { Notebook, Page } from "@/types";

function App() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Dialog states
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToEdit, setPageToEdit] = useState<Page | null>(null);

  // Load notebooks from localStorage on mount
  useEffect(() => {
    const stored = getNotebooks();
    setNotebooks(stored);
    if (stored.length > 0) {
      setSelectedNotebook(stored[0]);
      if (stored[0].pages.length > 0) {
        setSelectedPage(stored[0].pages[0]);
      }
    }
  }, []);

  const refreshNotebooks = (): Notebook[] => {
    const updated = getNotebooks();
    setNotebooks(updated);
    return updated;
  };

  const handleCreateNotebook = (title: string): void => {
    const newNotebook = createNotebook(title);
    refreshNotebooks();
    setSelectedNotebook(newNotebook);
    setSelectedPage(null);
  };

  const handleCreatePage = (title: string): void => {
    if (selectedNotebook) {
      const newPage = createPage(selectedNotebook.id, title);
      const updated = refreshNotebooks();
      const notebook = updated.find((n) => n.id === selectedNotebook.id);
      setSelectedNotebook(notebook || null);
      setSelectedPage(newPage);
    }
  };

  const handleSelectNotebook = (notebook: Notebook): void => {
    setSelectedNotebook(notebook);
    if (notebook.pages.length > 0) {
      setSelectedPage(notebook.pages[0]);
    } else {
      setSelectedPage(null);
    }
  };

  const handleUpdatePage = (updates: Partial<Page>): void => {
    if (selectedNotebook && selectedPage) {
      updatePage(selectedNotebook.id, selectedPage.id, updates);
      const updated = refreshNotebooks();
      const notebook = updated.find((n) => n.id === selectedNotebook.id);
      const page = notebook?.pages.find((p) => p.id === selectedPage.id);
      setSelectedPage(page || null);
      setSelectedNotebook(notebook || null);
    }
  };

  const handleOpenRenameDialog = (page: Page): void => {
    setPageToEdit(page);
    setRenameDialogOpen(true);
  };

  const handleRenamePage = (page: Page, newTitle: string): void => {
    if (selectedNotebook) {
      updatePage(selectedNotebook.id, page.id, { title: newTitle });
      const updated = refreshNotebooks();
      const notebook = updated.find((n) => n.id === selectedNotebook.id);
      setSelectedNotebook(notebook || null);
      if (selectedPage?.id === page.id) {
        const updatedPage = notebook?.pages.find((p) => p.id === page.id);
        setSelectedPage(updatedPage || null);
      }
    }
  };

  const handleOpenDeleteDialog = (page: Page): void => {
    setPageToEdit(page);
    setDeleteDialogOpen(true);
  };

  const handleDeletePage = (): void => {
    if (selectedNotebook && pageToEdit) {
      deletePageFromStorage(selectedNotebook.id, pageToEdit.id);
      const updated = refreshNotebooks();
      const notebook = updated.find((n) => n.id === selectedNotebook.id);
      setSelectedNotebook(notebook || null);

      // If deleting current page, select first available
      if (selectedPage?.id === pageToEdit.id) {
        if (notebook && notebook.pages.length > 0) {
          setSelectedPage(notebook.pages[0]);
        } else {
          setSelectedPage(null);
        }
      }
      setPageToEdit(null);
    }
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <ResizablePanel
          defaultWidth={256}
          minWidth={200}
          maxWidth={400}
          side="left"
          panelId="notebooks"
          activePanel={activePanel}
          onInteractionChange={setActivePanel}
        >
          <Sidebar
            notebooks={notebooks}
            selectedNotebook={selectedNotebook}
            onSelectNotebook={handleSelectNotebook}
            onCreateNotebook={handleCreateNotebook}
          />
        </ResizablePanel>

        <ResizablePanel
          defaultWidth={224}
          minWidth={180}
          maxWidth={400}
          side="left"
          panelId="pages"
          activePanel={activePanel}
          onInteractionChange={setActivePanel}
        >
          <PagesList
            pages={selectedNotebook?.pages || []}
            selectedPage={selectedPage}
            onSelectPage={setSelectedPage}
            onCreatePage={handleCreatePage}
            onDeletePage={handleOpenDeleteDialog}
            onRenamePage={handleOpenRenameDialog}
            notebookSelected={!!selectedNotebook}
          />
        </ResizablePanel>

        <Canvas page={selectedPage} onUpdatePage={handleUpdatePage} />
      </div>

      {/* Modals */}
      <RenamePageDialog
        page={pageToEdit}
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        onRename={handleRenamePage}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeletePage}
        title="Delete Page"
        itemName={pageToEdit?.title}
      />
    </>
  );
}

export default App;
