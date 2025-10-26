import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    notebookName: "My First Notebook",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Update user name and mark tutorial as completed
      await api.updateSettings({
        displayName: formData.displayName,
        tutorialCompleted: true,
      });

      // Create first notebook
      const notebook = await api.createNotebook({
        title: formData.notebookName,
        description: "My first notebook in Slate",
        tags: ["Getting Started"],
      });

      // Refresh user data
      await refreshUser();

      // Navigate to app
      navigate("/app");
    } catch (err: any) {
      console.error("Onboarding error details:", err);
      console.error("Error message:", err.message);
      console.error("Error response:", err.response);
      setError(
        err.message ||
          err.error ||
          "Failed to complete setup. Please check the console for details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      // Mark tutorial as completed even if skipped
      await api.updateSettings({
        tutorialCompleted: true,
      });
      await refreshUser();
      navigate("/app");
    } catch (err) {
      console.error("Error skipping onboarding:", err);
      // Navigate anyway
      navigate("/app");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-blue-600 dark:text-blue-400"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome to Slate! 🎉
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Let's get you set up with your workspace
          </p>
        </div>

        {/* Setup Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Display Name */}
            <div className="space-y-2">
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Your Name
              </label>
              <Input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                placeholder="Enter your name"
                required
                className="w-full"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This is how you'll appear to collaborators
              </p>
            </div>

            {/* First Notebook Name */}
            <div className="space-y-2">
              <label
                htmlFor="notebookName"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                First Notebook Name
              </label>
              <Input
                id="notebookName"
                type="text"
                value={formData.notebookName}
                onChange={(e) =>
                  setFormData({ ...formData, notebookName: e.target.value })
                }
                placeholder="e.g., Work Notes, Study Journal"
                required
                className="w-full"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You can create more notebooks later
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">Quick Tips:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Use tags to organize notebooks by topic</li>
                    <li>• Share notebooks with teammates for collaboration</li>
                    <li>• Search across all your content instantly</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={loading}
                className="flex-1"
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Setting up...
                  </span>
                ) : (
                  "Get Started"
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Progress Indicator */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
          <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
          <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
        </div>
      </div>
    </div>
  );
}
