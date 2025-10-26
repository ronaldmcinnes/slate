// Handle OAuth callback and extract token
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract token from URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const error = params.get("error");

        if (error) {
          console.error("Auth error:", error);
          navigate("/login?error=" + error);
          return;
        }

        if (token) {
          // Save token
          api.setToken(token);

          // Check if user has completed tutorial
          try {
            const user = await api.getCurrentUser();

            if (!user.tutorialCompleted) {
              // First-time user - redirect to tutorial/onboarding
              navigate("/onboarding");
            } else {
              // Existing user - redirect to app
              navigate("/app");
            }
          } catch (err) {
            // If error checking user, redirect to onboarding to be safe
            console.error("Error checking user:", err);
            navigate("/onboarding");
          }
        } else {
          // No token, redirect to login
          navigate("/login?error=no_token");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/login?error=callback_failed");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <LoadingSpinner size="lg" text="" showText={false} />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 mt-4">
          Authenticating...
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Please wait while we log you in.
        </p>
      </div>
    </div>
  );
}
