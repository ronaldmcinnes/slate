// Handle OAuth callback and extract token
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

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

          // Check if user has any notebooks (to determine if first-time user)
          try {
            const { owned } = await api.getNotebooks();

            if (owned.length === 0) {
              // First-time user - redirect to onboarding
              navigate("/onboarding");
            } else {
              // Existing user - redirect to app
              navigate("/app");
            }
          } catch (err) {
            // If error checking notebooks, still redirect to onboarding to be safe
            console.error("Error checking notebooks:", err);
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
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white mb-4"></div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
          Authenticating...
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Please wait while we log you in.
        </p>
      </div>
    </div>
  );
}
