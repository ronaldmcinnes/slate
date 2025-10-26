import { useState } from "react";
import { X, Mail, UserPlus, Trash2, Eye, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { Page } from "@/types";
import type { SharePageRequest } from "@shared/types";

interface SharePageDialogProps {
  page: Page | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShared: () => void;
}

export default function SharePageDialog({
  page,
  open,
  onOpenChange,
  onShared,
}: SharePageDialogProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<any[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);

  if (!open || !page) return null;

  const handleShare = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSharing(true);
    setError(null);
    setSuccess(null);

    try {
      const shareData: SharePageRequest = { email, permission };
      await api.sharePage(page.id.toString(), shareData);
      
      setSuccess(`Page shared successfully with ${email}`);
      setEmail("");
      setPermission("view");
      onShared();
      
      // Refresh share status
      await loadShareStatus();
    } catch (err: any) {
      setError(err.message || "Failed to share page");
    } finally {
      setIsSharing(false);
    }
  };

  const loadShareStatus = async () => {
    setLoadingStatus(true);
    try {
      const status = await api.getPageShareStatus(page.id.toString());
      setShareStatus(status);
    } catch (err) {
      console.error("Failed to load share status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    try {
      await api.revokePageShare(shareId);
      await loadShareStatus();
      setSuccess("Share revoked successfully");
    } catch (err: any) {
      setError(err.message || "Failed to revoke share");
    }
  };

  const handleOpen = (open: boolean) => {
    onOpenChange(open);
    if (open) {
      setError(null);
      setSuccess(null);
      loadShareStatus();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "accepted":
        return "text-green-600 bg-green-50";
      case "declined":
        return "text-red-600 bg-red-50";
      case "expired":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "accepted":
        return "✅";
      case "declined":
        return "❌";
      case "expired":
        return "⏰";
      default:
        return "❓";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold">Share Page</h2>
            <p className="text-sm text-gray-500 mt-1">{page.title}</p>
          </div>
          <button
            onClick={() => handleOpen(false)}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleShare();
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permission Level
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="permission"
                    value="view"
                    checked={permission === "view"}
                    onChange={(e) => setPermission(e.target.value as "view" | "edit")}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">View Only</span>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="permission"
                    value="edit"
                    checked={permission === "edit"}
                    onChange={(e) => setPermission(e.target.value as "view" | "edit")}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Edit3 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Can Edit</span>
                  </div>
                </label>
              </div>
            </div>

            <Button
              onClick={handleShare}
              disabled={isSharing || !email.trim()}
              className="w-full"
            >
              {isSharing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sharing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Share Page</span>
                </div>
              )}
            </Button>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Share Status */}
          {shareStatus.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Shared With
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadShareStatus}
                  disabled={loadingStatus}
                >
                  {loadingStatus ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {shareStatus.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {share.sharedWith}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            share.status
                          )}`}
                        >
                          {getStatusIcon(share.status)} {share.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">
                          {share.permission === "edit" ? (
                            <div className="flex items-center space-x-1">
                              <Edit3 className="w-3 h-3" />
                              <span>Can Edit</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>View Only</span>
                            </div>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(share.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeShare(share.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t dark:border-slate-700">
          <Button variant="outline" onClick={() => handleOpen(false)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

