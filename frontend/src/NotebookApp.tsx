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
        try {
          const pages = await api.getPages(allNotebooks[0].id);
          if (pages.length > 0) {
            setSelectedPage(pages[0]);
          }
        } catch (err) {
          console.error("Error loading pages:", err);
        }
      }
    } catch (error) {
      console.error("Error loading notebooks:", error);
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
        await refreshNotebooks();
        const updated = await api.getNotebooks();
        const allNotebooks = [...updated.owned, ...updated.shared];
        const notebook = allNotebooks.find((n) => n.id === selectedNotebook.id);
        setSelectedNotebook(notebook || null);
        setSelectedPage(newPage);
      } catch (error) {
        console.error("Error creating page:", error);
      }
    }
  };

  const handleSelectNotebook = async (notebook: Notebook): Promise<void> => {
    setSelectedNotebook(notebook);
    try {
      const pages = await api.getPages(notebook.id);
      if (pages.length > 0) {
        setSelectedPage(pages[0]);
      } else {
        setSelectedPage(null);
      }
    } catch (error) {
      console.error("Error loading pages:", error);
      setSelectedPage(null);
    }
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
        await refreshNotebooks();

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
        const updated = await refreshNotebooks();
        const notebook = updated.find((n) => n.id === selectedNotebook.id);
        setSelectedNotebook(notebook || null);

        // If deleting current page, select first available
        if (selectedPage?.id === pageToEdit.id) {
          const pages = await api.getPages(selectedNotebook.id);
          if (pages.length > 0) {
            setSelectedPage(pages[0]);
          } else {
            setSelectedPage(null);
          }
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
