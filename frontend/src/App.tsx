import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "@/lib/authContext";
import HomePage from "@/components/HomePage";
import LoginPage from "@/components/LoginPage";
import AuthCallback from "@/components/AuthCallback";
import OnboardingPage from "@/components/OnboardingPage";
import NotebookApp from "./NotebookApp";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Onboarding route */}
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Protected app route */}
          <Route path="/app/*" element={<NotebookApp />} />

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
