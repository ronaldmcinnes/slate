import { useState, useEffect } from "react";
import { Mail, Check, X, Clock, Eye, Edit3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { PageShareInvitation, SharedPage } from "@shared/types";

interface SharedPagesListProps {
  onPageSelect?: (page: any) => void;
}

export default function SharedPagesList({ onPageSelect }: SharedPagesListProps) {
  const [invitations, setInvitations] = useState<PageShareInvitation[]>([]);
  const [sharedPages, setSharedPages] = useState<SharedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invitationsData, sharedPagesData] = await Promise.all([
        api.getPageShareInvitations(),
        api.getSharedPages(),
      ]);
      setInvitations(invitationsData);
      setSharedPages(sharedPagesData);
    } catch (err) {
      setError("Failed to load shared pages");
      console.error("Error loading shared pages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (shareId: string) => {
    try {
      await api.acceptPageShare(shareId);
      await loadData(); // Refresh data
    } catch (err: any) {
      setError(err.message || "Failed to accept invitation");
    }
  };

  const handleDeclineInvitation = async (shareId: string) => {
    try {
      await api.declinePageShare(shareId);
      await loadData(); // Refresh data
    } catch (err: any) {
      setError(err.message || "Failed to decline invitation");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "accepted":
        return "text-green-600 bg-green-50 border-green-200";
      case "declined":
        return "text-red-600 bg-red-50 border-red-200";
      case "expired":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={loadData} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b dark:border-slate-700">
        <h2 className="text-lg font-semibold">Shared Pages</h2>
        <p className="text-sm text-gray-500 mt-1">
          Pages shared with you by other users
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Pending Invitations ({invitations.length})
            </h3>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className={`p-3 border rounded-lg ${getStatusColor(
                    isExpired(invitation.expiresAt) ? "expired" : "pending"
                  )}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        {invitation.page.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Shared by {invitation.sharedBy.displayName}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        {invitation.permission === "edit" ? (
                          <div className="flex items-center space-x-1 text-xs">
                            <Edit3 className="w-3 h-3" />
                            <span>Can Edit</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-xs">
                            <Eye className="w-3 h-3" />
                            <span>View Only</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1 text-xs">
                          <Clock className="w-3 h-3" />
                          <span>
                            Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-3">
                      {!isExpired(invitation.expiresAt) ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcceptInvitation(invitation.id)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineInvitation(invitation.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Decline
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">Expired</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accepted Shared Pages */}
        {sharedPages.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <ExternalLink className="w-4 h-4 mr-2" />
              Shared Pages ({sharedPages.length})
            </h3>
            <div className="space-y-2">
              {sharedPages.map((sharedPage) => (
                <div
                  key={sharedPage.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                  onClick={() => onPageSelect?.(sharedPage.page)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        {sharedPage.page.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Shared by {sharedPage.sharedBy.displayName}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        {sharedPage.permission === "edit" ? (
                          <div className="flex items-center space-x-1 text-xs">
                            <Edit3 className="w-3 h-3" />
                            <span>Can Edit</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-xs">
                            <Eye className="w-3 h-3" />
                            <span>View Only</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1 text-xs">
                          <Check className="w-3 h-3" />
                          <span>
                            Accepted {new Date(sharedPage.acceptedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {invitations.length === 0 && sharedPages.length === 0 && (
          <div className="p-8 text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No shared pages
            </h3>
            <p className="text-sm text-gray-500">
              When someone shares a page with you, it will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

