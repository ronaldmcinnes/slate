import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "@/lib/authContext";
import { ToastProvider } from "@/lib/toastContext";
import HomePage from "@/components/app/HomePage";
import LoginPage from "@/components/app/LoginPage";
import AuthCallback from "@/components/app/AuthCallback";
import OnboardingPage from "@/components/app/OnboardingPage";
import NotFoundPage from "@/components/app/NotFoundPage";
import ProtectedRoute from "@/components/app/ProtectedRoute";
import NotebookApp from "./components/app/NotebookApp";

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Onboarding - only accessible if tutorial NOT completed */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute requireAuth requireTutorialIncomplete>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            {/* App - requires auth and completed tutorial */}
            <Route
              path="/app/*"
              element={
                <ProtectedRoute requireAuth requireTutorialComplete>
                  <NotebookApp />
                </ProtectedRoute>
              }
            />

            {/* 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
