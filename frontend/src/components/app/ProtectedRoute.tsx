import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/authContext";
import { FullScreenLoadingSpinner } from "@/components/ui/loading-spinner";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireTutorialComplete?: boolean;
  requireTutorialIncomplete?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAuth = false,
  requireTutorialComplete = false,
  requireTutorialIncomplete = false,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return <FullScreenLoadingSpinner />;
  }

  // Check if authentication is required
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if tutorial completion is required
  if (requireTutorialComplete && user && !user.tutorialCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  // Check if tutorial should NOT be completed (for onboarding page)
  if (requireTutorialIncomplete && user && user.tutorialCompleted) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
