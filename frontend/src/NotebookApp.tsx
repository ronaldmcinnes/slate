import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import PagesList from "@/components/layout/PagesList";
import Canvas from "@/components/canvas/Canvas";
import ResizablePanel from "@/components/layout/ResizablePanel";
import RenamePageDialog from "@/components/dialogs/RenamePageDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { ToastContainer } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/lib/toastContext";
import type { Notebook, Page as SharedPage } from "@shared/types";
import type { Page } from "@/types";

interface NotebookAppProps {
  onNavigateHome?: () => void;
}

export default function NotebookApp({ onNavigateHome }: NotebookAppProps) {
  const { user, updateCanvasState } = useAuth();
  const { addToast } = useToast();
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

  const loadPagesForNotebook = async (
    notebookId: string,
    options: { autoSelectFirst?: boolean; preserveSelection?: boolean } = {}
  ) => {
    const { autoSelectFirst = true, preserveSelection = true } = options;

    try {
      const fetchedPages = await api.getPages(notebookId);
      // Convert shared types to frontend types
      const convertedPages = fetchedPages.map((page) =>
        convertPageToFrontendType(page)
      );
      setPages(convertedPages);

      // Handle page selection logic
      if (autoSelectFirst) {
        if (preserveSelection && selectedPage) {
          // Check if current selection still exists in the new pages
          const pageStillExists = convertedPages.some(
            (p) => p.id === selectedPage.id
          );
          if (!pageStillExists) {
            // Current page was deleted or is unavailable, select first
            if (convertedPages.length > 0) {
              setSelectedPage(convertedPages[0]);
            } else {
              setSelectedPage(null);
            }
          }
          // If page still exists, keep current selection (don't call setSelectedPage)
        } else {
          // Don't preserve selection, select first page
          if (convertedPages.length > 0) {
            setSelectedPage(convertedPages[0]);
          } else {
            setSelectedPage(null);
          }
        }
      }
    } catch (err) {
      console.error("Error loading pages:", err);
      setPages([]);
      if (autoSelectFirst && !preserveSelection) {
        setSelectedPage(null);
      }
    }
  };

  const convertPageToFrontendType = (sharedPage: SharedPage): Page => {
    return {
      id: sharedPage.id,
      title: sharedPage.title,
      createdAt: sharedPage.createdAt,
      lastModified: sharedPage.lastModified,
      content: sharedPage.content,
      drawings: sharedPage.drawings,
      graphs: sharedPage.graphs,
      textBoxes: sharedPage.textBoxes,
    };
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
        // Reload pages to include the new one, preserving current selection
        await loadPagesForNotebook(selectedNotebook.id, {
          autoSelectFirst: false,
          preserveSelection: true,
        });
        setSelectedPage(convertPageToFrontendType(newPage));
      } catch (error) {
        console.error("Error creating page:", error);
      }
    }
  };

  const handleSelectNotebook = async (notebook: Notebook): Promise<void> => {
    setSelectedNotebook(notebook);
    await loadPagesForNotebook(notebook.id, {
      autoSelectFirst: true,
      preserveSelection: false,
    });
  };

  const handleUpdatePage = async (updates: Partial<Page>): Promise<void> => {
    if (selectedNotebook && selectedPage) {
      try {
        const updatedPage = await api.updatePage(selectedPage.id, updates);
        // Update local state directly instead of refreshing all notebooks
        const convertedPage = convertPageToFrontendType(updatedPage);
        setSelectedPage(convertedPage);

        // Update pages list locally
        setPages(
          pages.map((p) => (p.id === convertedPage.id ? convertedPage : p))
        );
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
        const updatedPage = await api.updatePage(page.id, {
          title: newTitle,
        });

        // Update local state directly instead of reloading pages
        const convertedPage = convertPageToFrontendType(updatedPage);
        setPages(
          pages.map((p) => (p.id === convertedPage.id ? convertedPage : p))
        );

        if (selectedPage?.id === page.id) {
          setSelectedPage(convertedPage);
        }

        setRenameDialogOpen(false);
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
        console.log("🗑️ Deleting page:", pageToEdit.id, pageToEdit.title);
        const isDeleted = selectedPage?.id === pageToEdit.id;

        await api.deletePage(pageToEdit.id);
        console.log("✅ Page deleted successfully on backend");

        // Reload pages after deletion
        const fetchedPages = await api.getPages(selectedNotebook.id);
        const convertedPages = fetchedPages.map((page) =>
          convertPageToFrontendType(page)
        );
        setPages(convertedPages);
        console.log("📄 Reloaded pages, count:", convertedPages.length);

        // If we deleted the currently selected page, select the first remaining page
        if (isDeleted) {
          if (convertedPages.length > 0) {
            setSelectedPage(convertedPages[0]);
          } else {
            setSelectedPage(null);
          }
        }

        setPageToEdit(null);
        setDeleteDialogOpen(false);

        // Show toast with undo option
        addToast({
          message: "Deleted",
          itemName: pageToEdit.title,
          type: "delete-page",
          onUndo: async () => {
            await api.restorePage(pageToEdit.id);
            // Reload pages to show restored page
            const updatedPages = await api.getPages(selectedNotebook.id);
            const convertedUpdatedPages = updatedPages.map((page) =>
              convertPageToFrontendType(page)
            );
            setPages(convertedUpdatedPages);
            console.log("✅ Page restored successfully");
          },
        });
      } catch (error) {
        console.error("❌ Error deleting page:", error);
        // Keep dialog open on error so user can retry
      }
    }
  };

  const handleSidebarCollapsedChange = (collapsed: boolean) => {
    updateCanvasState({
      expandedPanels: {
        sidebar: !collapsed,
      },
    });
  };

  const handlePagesListCollapsedChange = (collapsed: boolean) => {
    updateCanvasState({
      expandedPanels: {
        pagesList: !collapsed,
      },
    });
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
          initialCollapsed={
            user?.canvasState?.expandedPanels?.sidebar === false
          }
          onCollapsedChange={handleSidebarCollapsedChange}
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
          initialCollapsed={
            user?.canvasState?.expandedPanels?.pagesList === false
          }
          onCollapsedChange={handlePagesListCollapsedChange}
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
      <ToastContainer />
    </>
  );
}
