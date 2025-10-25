import { useState } from "react";
import HomePage from "./components/HomePage";
import NotebookApp from "./NotebookApp";

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'app'>('home');

  const handleNavigateToApp = () => {
    setCurrentView('app');
  };

  const handleNavigateToHome = () => {
    setCurrentView('home');
  };

  if (currentView === 'app') {
    return <NotebookApp onNavigateHome={handleNavigateToHome} />;
  }

  return <HomePage onNavigateToApp={handleNavigateToApp} />;
}

export default App;