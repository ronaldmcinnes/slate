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

function App() {
  const [notebooks, setNotebooks] = useState([]);
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [activePanel, setActivePanel] = useState(null);

  // Dialog states
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToEdit, setPageToEdit] = useState(null);

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

  const refreshNotebooks = () => {
    const updated = getNotebooks();
    setNotebooks(updated);
    return updated;
  };

  const handleCreateNotebook = (title) => {
    const newNotebook = createNotebook(title);
    refreshNotebooks();
    setSelectedNotebook(newNotebook);
    setSelectedPage(null);
  };

  const handleCreatePage = (title) => {
    if (selectedNotebook) {
      const newPage = createPage(selectedNotebook.id, title);
      const updated = refreshNotebooks();
      const notebook = updated.find((n) => n.id === selectedNotebook.id);
      setSelectedNotebook(notebook);
      setSelectedPage(newPage);
    }
  };

  const handleSelectNotebook = (notebook) => {
    setSelectedNotebook(notebook);
    if (notebook.pages.length > 0) {
      setSelectedPage(notebook.pages[0]);
    } else {
      setSelectedPage(null);
    }
  };

  const handleUpdatePage = (updates) => {
    if (selectedNotebook && selectedPage) {
      updatePage(selectedNotebook.id, selectedPage.id, updates);
      const updated = refreshNotebooks();
      const notebook = updated.find((n) => n.id === selectedNotebook.id);
      const page = notebook.pages.find((p) => p.id === selectedPage.id);
      setSelectedPage(page);
      setSelectedNotebook(notebook);
    }
  };

  const handleOpenRenameDialog = (page) => {
    setPageToEdit(page);
    setRenameDialogOpen(true);
  };

  const handleRenamePage = (page, newTitle) => {
    if (selectedNotebook) {
      updatePage(selectedNotebook.id, page.id, { title: newTitle });
      const updated = refreshNotebooks();
      const notebook = updated.find((n) => n.id === selectedNotebook.id);
      setSelectedNotebook(notebook);
      if (selectedPage?.id === page.id) {
        const updatedPage = notebook.pages.find((p) => p.id === page.id);
        setSelectedPage(updatedPage);
      }
    }
  };

  const handleOpenDeleteDialog = (page) => {
    setPageToEdit(page);
    setDeleteDialogOpen(true);
  };

  const handleDeletePage = () => {
    if (selectedNotebook && pageToEdit) {
      deletePageFromStorage(selectedNotebook.id, pageToEdit.id);
      const updated = refreshNotebooks();
      const notebook = updated.find((n) => n.id === selectedNotebook.id);
      setSelectedNotebook(notebook);

      // If deleting current page, select first available
      if (selectedPage?.id === pageToEdit.id) {
        if (notebook.pages.length > 0) {
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
