import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import PagesList from "@/components/layout/PagesList";
import Canvas from "@/components/canvas/Canvas";
import ResizablePanel from "@/components/layout/ResizablePanel";
import RenamePageDialog from "@/components/dialogs/RenamePageDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { api } from "@/lib/api";
import type { Notebook, Page } from "@shared/types";

interface NotebookAppProps {
  onNavigateHome?: () => void;
}

export default function NotebookApp({ onNavigateHome }: NotebookAppProps) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(
    null
  );
  const [pages, setPages] = useState<Page[]>([]); // Add pages state
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Dialog states
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToEdit, setPageToEdit] = useState<Page | null>(null);

  // Load notebooks from API on mount
  useEffect(() => {
    loadNotebooks();
  }, []);

  const loadNotebooks = async () => {
    try {
      const { owned, shared } = await api.getNotebooks();
      const allNotebooks = [...owned, ...shared];
      setNotebooks(allNotebooks);

      if (allNotebooks.length > 0) {
        setSelectedNotebook(allNotebooks[0]);
        // Load pages for the first notebook
        await loadPagesForNotebook(allNotebooks[0].id);
      }
    } catch (error) {
      console.error("Error loading notebooks:", error);
    }
  };

  const loadPagesForNotebook = async (notebookId: string) => {
    try {
      const fetchedPages = await api.getPages(notebookId);
      setPages(fetchedPages);
      if (fetchedPages.length > 0) {
        setSelectedPage(fetchedPages[0]);
      } else {
        setSelectedPage(null);
      }
    } catch (err) {
      console.error("Error loading pages:", err);
      setPages([]);
      setSelectedPage(null);
    }
  };

  const refreshNotebooks = async (): Promise<Notebook[]> => {
    try {
      const { owned, shared } = await api.getNotebooks();
      const allNotebooks = [...owned, ...shared];
      setNotebooks(allNotebooks);
      return allNotebooks;
    } catch (error) {
      console.error("Error refreshing notebooks:", error);
      return [];
    }
  };

  const handleCreateNotebook = async (title: string): Promise<void> => {
    try {
      const newNotebook = await api.createNotebook({ title });
      await refreshNotebooks();
      setSelectedNotebook(newNotebook);
      setSelectedPage(null);
    } catch (error) {
      console.error("Error creating notebook:", error);
    }
  };

  const handleCreatePage = async (title: string): Promise<void> => {
    if (selectedNotebook) {
      try {
        const newPage = await api.createPage(selectedNotebook.id, { title });
        // Reload pages to include the new one
        await loadPagesForNotebook(selectedNotebook.id);
        setSelectedPage(newPage);
      } catch (error) {
        console.error("Error creating page:", error);
      }
    }
  };

  const handleSelectNotebook = async (notebook: Notebook): Promise<void> => {
    setSelectedNotebook(notebook);
    await loadPagesForNotebook(notebook.id);
  };

  const handleUpdatePage = async (updates: Partial<Page>): Promise<void> => {
    if (selectedNotebook && selectedPage) {
      try {
        const updatedPage = await api.updatePage(selectedPage.id, updates);
        await refreshNotebooks();
        setSelectedPage(updatedPage);
      } catch (error) {
        console.error("Error updating page:", error);
      }
    }
  };

  const handleOpenRenameDialog = (page: Page): void => {
    setPageToEdit(page);
    setRenameDialogOpen(true);
  };

  const handleRenamePage = async (
    page: Page,
    newTitle: string
  ): Promise<void> => {
    if (selectedNotebook) {
      try {
        const updatedPage = await api.updatePage(page.id, { title: newTitle });

        // Reload pages to reflect the change
        await loadPagesForNotebook(selectedNotebook.id);

        if (selectedPage?.id === page.id) {
          setSelectedPage(updatedPage);
        }
      } catch (error) {
        console.error("Error renaming page:", error);
      }
    }
  };

  const handleOpenDeleteDialog = (page: Page): void => {
    setPageToEdit(page);
    setDeleteDialogOpen(true);
  };

  const handleDeletePage = async (): Promise<void> => {
    if (selectedNotebook && pageToEdit) {
      try {
        await api.deletePage(pageToEdit.id);

        // Reload pages after deletion
        await loadPagesForNotebook(selectedNotebook.id);

        // If deleting current page, pages state is already updated
        if (selectedPage?.id === pageToEdit.id && pages.length > 0) {
          setSelectedPage(pages[0]);
        }

        setPageToEdit(null);
      } catch (error) {
        console.error("Error deleting page:", error);
      }
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
            onNotebookChanged={loadNotebooks}
            onNavigateHome={onNavigateHome}
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
            pages={pages}
            selectedPage={selectedPage}
            onSelectPage={setSelectedPage}
            onCreatePage={handleCreatePage}
            onDeletePage={handleOpenDeleteDialog}
            onRenamePage={handleOpenRenameDialog}
            notebookSelected={!!selectedNotebook}
          />
        </ResizablePanel>

        <Canvas
          page={selectedPage}
          onUpdatePage={handleUpdatePage}
          permission={selectedNotebook?.permission}
        />
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
