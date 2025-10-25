import { useState } from "react";
import { X, Mail, UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Notebook } from "@shared/types";

interface ShareNotebookDialogProps {
  notebook: Notebook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShared: () => void;
}

export default function ShareNotebookDialog({
  notebook,
  open,
  onOpenChange,
  onShared,
}: ShareNotebookDialogProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !notebook) return null;

  const handleShare = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setIsSharing(true);
    setError(null);

    try {
      await api.shareNotebook(notebook.id, { email, permission });
      setEmail("");
      setPermission("view");
      onShared();
      // Don't close dialog so user can share with multiple people
    } catch (err: any) {
      setError(err.message || "Failed to share notebook");
    } finally {
      setIsSharing(false);
    }
  };

  const handleUnshare = async (userId: string) => {
    try {
      await api.unshareNotebook(notebook.id, userId);
      onShared();
    } catch (err: any) {
      setError(err.message || "Failed to remove access");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold">Share Notebook</h2>
            <p className="text-sm text-gray-500 mt-1">{notebook.title}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Share Form */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Share with
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="pl-10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleShare();
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permission
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPermission("view")}
                  className={`
                    flex-1 px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium
                    ${
                      permission === "view"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }
                  `}
                >
                  View Only
                </button>
                <button
                  onClick={() => setPermission("edit")}
                  className={`
                    flex-1 px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium
                    ${
                      permission === "edit"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }
                  `}
                >
                  Can Edit
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <Button
              onClick={handleShare}
              disabled={isSharing || !email.trim()}
              className="w-full"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {isSharing ? "Sharing..." : "Share"}
            </Button>
          </div>

          {/* Shared With List */}
          {notebook.sharedWith && notebook.sharedWith.length > 0 && (
            <div className="pt-4 border-t dark:border-slate-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Shared with ({notebook.sharedWith.length})
              </h3>
              <div className="space-y-2">
                {notebook.sharedWith.map((share) => (
                  <div
                    key={share.userId}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {share.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {share.permission === "view" ? "Can view" : "Can edit"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleUnshare(share.userId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
