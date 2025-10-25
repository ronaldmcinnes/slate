import { useState } from "react";
import Sidebar from "./components/Sidebar";
import PagesList from "./components/PagesList";
import Canvas from "./components/Canvas";

// Mock data
const mockNotebooks = [
  {
    id: 1,
    title: "Calculus I",
    pages: [
      {
        id: 1,
        title: "Derivatives Introduction",
        lastModified: "2025-10-24T10:30:00",
        content: "",
      },
      {
        id: 2,
        title: "Chain Rule Examples",
        lastModified: "2025-10-23T14:20:00",
        content: "",
      },
      {
        id: 3,
        title: "Integration Basics",
        lastModified: "2025-10-22T09:15:00",
        content: "",
      },
    ],
  },
  {
    id: 2,
    title: "Linear Algebra",
    pages: [
      {
        id: 4,
        title: "Matrix Operations",
        lastModified: "2025-10-24T11:00:00",
        content: "",
      },
      {
        id: 5,
        title: "Eigenvalues & Eigenvectors",
        lastModified: "2025-10-21T16:45:00",
        content: "",
      },
    ],
  },
  {
    id: 3,
    title: "Physics 101",
    pages: [
      {
        id: 6,
        title: "Newtons Laws",
        lastModified: "2025-10-20T13:30:00",
        content: "",
      },
      {
        id: 7,
        title: "Energy & Momentum",
        lastModified: "2025-10-19T10:00:00",
        content: "",
      },
      {
        id: 8,
        title: "Rotational Motion",
        lastModified: "2025-10-18T15:20:00",
        content: "",
      },
    ],
  },
];

function App() {
  const [selectedNotebook, setSelectedNotebook] = useState(mockNotebooks[0]);
  const [selectedPage, setSelectedPage] = useState(mockNotebooks[0].pages[0]);

  const handleSelectNotebook = (notebook) => {
    setSelectedNotebook(notebook);
    if (notebook.pages.length > 0) {
      setSelectedPage(notebook.pages[0]);
    } else {
      setSelectedPage(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        notebooks={mockNotebooks}
        selectedNotebook={selectedNotebook}
        onSelectNotebook={handleSelectNotebook}
      />
      <PagesList
        pages={selectedNotebook?.pages || []}
        selectedPage={selectedPage}
        onSelectPage={setSelectedPage}
      />
      <Canvas page={selectedPage} />
    </div>
  );
}

export default App;
