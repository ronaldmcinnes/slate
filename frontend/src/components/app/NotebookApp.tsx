import { useState, useEffect, useRef, useCallback } from "react";
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
import { useCanvasState } from "@/hooks/useCanvasState";
import { useOptimizedData } from "@/hooks/useOptimizedData";
import type { Notebook, Page as SharedPage } from "@shared/types";
import type { Page } from "@/types";

interface NotebookAppProps {
  onNavigateHome?: () => void;
}

export default function NotebookApp({ onNavigateHome }: NotebookAppProps) {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Canvas state management with persistence
  const {
    state: canvasState,
    isInitialized: canvasStateInitialized,
    setCurrentNotebook,
    setCurrentPage,
    setLastAccessedPage,
    setLastAccessedNotebook,
    getLastAccessedPage,
    getCurrentNotebookId,
    setExpandedPanel,
    setColumnWidth,
  } = useCanvasState();

  // Optimized data fetching
  const {
    getNotebooks,
    getPagesForNotebook,
    getPage,
    preloadAllNotebookPages,
    preloadCurrentNotebookPages,
    loadingStates,
    invalidateCache,
    updateCache,
  } = useOptimizedData();

  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(
    null
  );
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Track if an update is in progress to prevent stutter
  const updateInProgressRef = useRef<Set<string>>(new Set());

  // Track if we've already loaded the initial notebook to prevent multiple calls
  const initialLoadRef = useRef<boolean>(false);

  // Dialog states
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [notebookToLeave, setNotebookToLeave] = useState<Notebook | null>(null);
  const [pageToEdit, setPageToEdit] = useState<Page | null>(null);

  // Load notebooks from API on mount
  useEffect(() => {
    loadNotebooks();
  }, []);

  // Restore previous state when canvas state is initialized
  useEffect(() => {
    if (
      canvasStateInitialized &&
      notebooks.length > 0 &&
      !initialLoadRef.current
    ) {
      const currentNotebookId = getCurrentNotebookId();

      if (currentNotebookId) {
        const previousNotebook = notebooks.find(
          (n) => n.id === currentNotebookId
        );
        if (previousNotebook) {
          initialLoadRef.current = true;
          setSelectedNotebook(previousNotebook);
          loadPagesForNotebook(previousNotebook.id, {
            autoSelectFirst: true,
            preserveSelection: true,
          });
        } else {
        }
      } else {
      }
    }
  }, [canvasStateInitialized, getCurrentNotebookId, notebooks]);

  const loadNotebooks = async () => {
    try {
      const { owned, shared } = await getNotebooks();
      const allNotebooks = [...owned, ...shared];
      setNotebooks(allNotebooks);

      // Preload all notebook pages in background for instant switching (non-blocking)
      if (allNotebooks.length > 0) {
        // Don't await this - let it run in background
        preloadAllNotebookPages(allNotebooks).catch(console.error);
      }

      // If no previous state or previous notebook not found, select first notebook
      if (
        allNotebooks.length > 0 &&
        (!canvasState.currentNotebookId ||
          !allNotebooks.find((n) => n.id === canvasState.currentNotebookId))
      ) {
        setSelectedNotebook(allNotebooks[0]);
        setCurrentNotebook(allNotebooks[0].id);
        await loadPagesForNotebook(allNotebooks[0].id);
      }
    } catch (error) {
      console.error("Failed to load notebooks:", error);
    }
  };

  const loadPagesForNotebook = async (
    notebookId: string,
    options: { autoSelectFirst?: boolean; preserveSelection?: boolean } = {}
  ) => {
    const { autoSelectFirst = true, preserveSelection = true } = options;

    // Prevent multiple simultaneous calls for the same notebook
    if (updateInProgressRef.current.has(notebookId)) {
      return;
    }

    updateInProgressRef.current.add(notebookId);

    try {
      const convertedPages = await getPagesForNotebook(notebookId);
      setPages(convertedPages);

      // Handle page selection logic
      if (autoSelectFirst) {
        // First, try to restore the last accessed page for this notebook
        const lastAccessedPageId = getLastAccessedPage(notebookId);
        if (lastAccessedPageId) {
          const lastAccessedPage = convertedPages.find(
            (p) => p.id === lastAccessedPageId
          );
          if (lastAccessedPage) {
            setSelectedPage(lastAccessedPage);
            setCurrentPage(lastAccessedPage.id);
            return; // Found and selected last accessed page
          } else {
          }
        } else {
        }

        // If no last accessed page or it doesn't exist, use preserveSelection logic
        if (preserveSelection && canvasState.currentPageId) {
          // Check if previous page still exists in the new pages
          const previousPage = convertedPages.find(
            (p) => p.id === canvasState.currentPageId
          );
          if (previousPage) {
            setSelectedPage(previousPage);
            setCurrentPage(previousPage.id);
          } else if (convertedPages.length > 0) {
            // Previous page not found, select first
            setSelectedPage(convertedPages[0]);
            setCurrentPage(convertedPages[0].id);
          } else {
            setSelectedPage(null);
            setCurrentPage(null);
          }
        } else {
          // Don't preserve selection, select first page
          if (convertedPages.length > 0) {
            setSelectedPage(convertedPages[0]);
            setCurrentPage(convertedPages[0].id);
          } else {
            setSelectedPage(null);
            setCurrentPage(null);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load pages:", err);
      setPages([]);
      if (autoSelectFirst && !preserveSelection) {
        setSelectedPage(null);
        setCurrentPage(null);
      }
    } finally {
      // Clean up the loading state
      updateInProgressRef.current.delete(notebookId);
    }
  };

  const refreshNotebooks = async (): Promise<Notebook[]> => {
    try {
      const { owned, shared } = await getNotebooks(true); // Force refresh
      const allNotebooks = [...owned, ...shared];
      setNotebooks(allNotebooks);
      return allNotebooks;
    } catch (error) {
      console.error("Failed to refresh notebooks:", error);
      return [];
    }
  };

  const handleCreateNotebook = async (title: string): Promise<void> => {
    try {
      const newNotebook = await api.createNotebook({ title });
      await refreshNotebooks();
      setSelectedNotebook(newNotebook);
      setCurrentNotebook(newNotebook.id);
      setSelectedPage(null);
      setCurrentPage(null);
    } catch (error) {
      console.error("Failed to create notebook:", error);
    }
  };

  const handleLeaveNotebook = (notebook: Notebook): void => {
    setNotebookToLeave(notebook);
    setLeaveDialogOpen(true);
  };

  const handleConfirmLeaveNotebook = async (): Promise<void> => {
    if (!notebookToLeave) return;

    try {
      await api.leaveNotebook(notebookToLeave.id);
      await refreshNotebooks();

      // If we're leaving the currently selected notebook, clear the selection
      if (selectedNotebook?.id === notebookToLeave.id) {
        setSelectedNotebook(null);
        setSelectedPage(null);
        setCurrentNotebook(null);
        setCurrentPage(null);
      }

      // Close the dialog
      setLeaveDialogOpen(false);
      setNotebookToLeave(null);
    } catch (error) {
      console.error("Failed to leave notebook:", error);
      // For now, just log the error since we don't have an error toast type
      // TODO: Add error toast type to toast context
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

        // Select the new page
        const convertedPage = {
          id: newPage.id,
          title: newPage.title,
          createdAt: newPage.createdAt,
          lastModified: newPage.lastModified,
          content: newPage.content,
          drawings: newPage.drawings,
          graphs: newPage.graphs,
          textBoxes: newPage.textBoxes,
        };
        setSelectedPage(convertedPage);
        setCurrentPage(convertedPage.id);
      } catch (error) {
        console.error("Failed to create page:", error);
      }
    }
  };

  const handleSelectNotebook = async (notebook: Notebook): Promise<void> => {
    setSelectedNotebook(notebook);
    setCurrentNotebook(notebook.id);
    setLastAccessedNotebook(notebook.id); // Save the last accessed notebook

    // Load pages immediately from cache if available
    await loadPagesForNotebook(notebook.id, {
      autoSelectFirst: true,
      preserveSelection: false,
    });

    // Aggressively preload all pages of the current notebook in background
    preloadCurrentNotebookPages(notebook.id);
  };

  const handleSelectPage = async (page: Page) => {
    try {
      // Use optimized page loading with caching
      const fullPageData = await getPage(page.id);
      if (fullPageData) {
        setSelectedPage(fullPageData);
        setCurrentPage(fullPageData.id);

        // Track last accessed page for this notebook
        if (selectedNotebook) {
          setLastAccessedPage(selectedNotebook.id, fullPageData.id);
        }
      } else {
        // Fallback to the metadata page if full data fails to load
        setSelectedPage(page);
        setCurrentPage(page.id);

        // Track last accessed page for this notebook
        if (selectedNotebook) {
          setLastAccessedPage(selectedNotebook.id, page.id);
        }
      }
    } catch (error) {
      console.error("Failed to load full page data:", error);
      // Fallback to the metadata page if full data fails to load
      setSelectedPage(page);
      setCurrentPage(page.id);

      // Track last accessed page for this notebook
      if (selectedNotebook) {
        setLastAccessedPage(selectedNotebook.id, page.id);
      }
    }
  };

  const handleUpdatePage = async (updates: Partial<Page>): Promise<void> => {
    if (selectedNotebook && selectedPage) {
      // Don't make API calls in view-only mode
      if (selectedNotebook.permission === "view") {
        return;
      }

      // Prevent multiple simultaneous updates for the same page
      if (updateInProgressRef.current.has(selectedPage.id)) {
        return;
      }

      updateInProgressRef.current.add(selectedPage.id);

      try {
        const updatedPage = await api.updatePage(selectedPage.id, updates);
        // Update local state directly instead of refreshing all notebooks
        const convertedPage = {
          id: updatedPage.id,
          title: updatedPage.title,
          createdAt: updatedPage.createdAt,
          lastModified: updatedPage.lastModified,
          content: updatedPage.content,
          drawings: updatedPage.drawings,
          graphs: updatedPage.graphs,
          textBoxes: updatedPage.textBoxes,
        };

        // Update cache first to prevent any reloading
        updateCache("pages", selectedPage.id, convertedPage);

        // Then update local state atomically to prevent stutter
        setSelectedPage(convertedPage);
        setPages(
          pages.map((p) => (p.id === convertedPage.id ? convertedPage : p))
        );
      } catch (error) {
        console.error("Failed to update page:", error);
      } finally {
        updateInProgressRef.current.delete(selectedPage.id);
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
        const convertedPage = {
          id: updatedPage.id,
          title: updatedPage.title,
          createdAt: updatedPage.createdAt,
          lastModified: updatedPage.lastModified,
          content: updatedPage.content,
          drawings: updatedPage.drawings,
          graphs: updatedPage.graphs,
          textBoxes: updatedPage.textBoxes,
        };
        setPages(
          pages.map((p) => (p.id === convertedPage.id ? convertedPage : p))
        );

        if (selectedPage?.id === page.id) {
          setSelectedPage(convertedPage);
        }

        // Update cache with the new data instead of invalidating
        updateCache("pages", page.id, convertedPage);

        setRenameDialogOpen(false);
      } catch (error) {
        console.error("Failed to rename page:", error);
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
        const convertedPages = await getPagesForNotebook(
          selectedNotebook.id,
          true
        );
        setPages(convertedPages);

        // If we deleted the currently selected page, select the first remaining page
        if (selectedPage?.id === pageToEdit.id) {
          if (convertedPages.length > 0) {
            setSelectedPage(convertedPages[0]);
            setCurrentPage(convertedPages[0].id);
          } else {
            setSelectedPage(null);
            setCurrentPage(null);
          }
        }

        // Remove the deleted page from cache
        invalidateCache("pages", pageToEdit.id);

        setPageToEdit(null);
        setDeleteDialogOpen(false);

        // Show toast with undo option
        addToast({
          message: "Deleted",
          itemName: pageToEdit.title,
          type: "delete-page",
          onUndo: async () => {
            const restoredPage = await api.restorePage(pageToEdit.id);
            // Reload pages to show restored page
            const updatedPages = await getPagesForNotebook(
              selectedNotebook.id,
              true
            );
            setPages(updatedPages);

            // Invalidate cache to ensure fresh data
            invalidateCache("pages", restoredPage.id);
          },
        });
      } catch (error) {
        console.error("Failed to delete page:", error);
      }
    }
  };

  const handleSidebarCollapsedChange = (collapsed: boolean) => {
    setExpandedPanel("sidebar", !collapsed);
  };

  const handlePagesListCollapsedChange = (collapsed: boolean) => {
    setExpandedPanel("pagesList", !collapsed);
  };

  const handleSidebarWidthChange = (width: number) => {
    setColumnWidth("sidebar", width);
  };

  const handlePagesListWidthChange = (width: number) => {
    setColumnWidth("pagesList", width);
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <ResizablePanel
          defaultWidth={canvasState.columnWidths.sidebar}
          minWidth={200}
          maxWidth={400}
          side="left"
          panelId="notebooks"
          activePanel={activePanel}
          onInteractionChange={setActivePanel}
          initialCollapsed={canvasState.expandedPanels.sidebar === false}
          onCollapsedChange={handleSidebarCollapsedChange}
          onWidthChange={handleSidebarWidthChange}
        >
          <Sidebar
            notebooks={notebooks}
            selectedNotebook={selectedNotebook}
            onSelectNotebook={handleSelectNotebook}
            onCreateNotebook={handleCreateNotebook}
            onNotebookChanged={loadNotebooks}
            onNavigateHome={onNavigateHome}
            isLoading={loadingStates.notebooks}
            onLeaveNotebook={handleLeaveNotebook}
          />
        </ResizablePanel>

        <ResizablePanel
          defaultWidth={canvasState.columnWidths.pagesList}
          minWidth={180}
          maxWidth={400}
          side="left"
          panelId="pages"
          activePanel={activePanel}
          onInteractionChange={setActivePanel}
          initialCollapsed={canvasState.expandedPanels.pagesList === false}
          onCollapsedChange={handlePagesListCollapsedChange}
          onWidthChange={handlePagesListWidthChange}
        >
          <PagesList
            pages={pages}
            selectedPage={selectedPage}
            onSelectPage={handleSelectPage}
            onCreatePage={handleCreatePage}
            onDeletePage={handleOpenDeleteDialog}
            onRenamePage={handleOpenRenameDialog}
            notebookSelected={!!selectedNotebook}
            isLoading={loadingStates.pages}
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

      <DeleteConfirmDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        onConfirm={handleConfirmLeaveNotebook}
        title="Leave Notebook"
        description={`Are you sure you want to leave "${notebookToLeave?.title}"? You will no longer have access to this notebook.`}
        confirmButtonText="Leave"
        confirmButtonVariant="destructive"
      />
      <ToastContainer />
    </>
  );
}
