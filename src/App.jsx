import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import PagesList from "./components/PagesList";
import Canvas from "./components/Canvas";
import {
  getNotebooks,
  createNotebook,
  createPage,
  updatePage,
} from "./lib/storage";

function App() {
  const [notebooks, setNotebooks] = useState([]);
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);

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

  const handleCreateNotebook = (title) => {
    const newNotebook = createNotebook(title);
    const updated = getNotebooks();
    setNotebooks(updated);
    setSelectedNotebook(newNotebook);
    setSelectedPage(null);
  };

  const handleCreatePage = (title) => {
    if (selectedNotebook) {
      const newPage = createPage(selectedNotebook.id, title);
      const updated = getNotebooks();
      setNotebooks(updated);
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
      const updated = getNotebooks();
      setNotebooks(updated);
      const notebook = updated.find((n) => n.id === selectedNotebook.id);
      const page = notebook.pages.find((p) => p.id === selectedPage.id);
      setSelectedPage(page);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        notebooks={notebooks}
        selectedNotebook={selectedNotebook}
        onSelectNotebook={handleSelectNotebook}
        onCreateNotebook={handleCreateNotebook}
      />
      <PagesList
        pages={selectedNotebook?.pages || []}
        selectedPage={selectedPage}
        onSelectPage={setSelectedPage}
        onCreatePage={handleCreatePage}
        notebookSelected={!!selectedNotebook}
      />
      <Canvas page={selectedPage} onUpdatePage={handleUpdatePage} />
    </div>
  );
}

export default App;
