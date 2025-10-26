import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, X, Eye, Edit3, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/authContext";

export default function SharedPageInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      const data = await api.getInvitationByToken(token!);
      setInvitation(data);
    } catch (err: any) {
      setError(err.message || "Invalid or expired invitation link");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitation) return;

    try {
      setProcessing(true);
      await api.acceptPageShare(invitation.id);
      
      // Redirect to the app
      navigate("/app");
    } catch (err: any) {
      setError(err.message || "Failed to accept invitation");
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;

    try {
      setProcessing(true);
      await api.declinePageShare(invitation.id);
      
      // Redirect to the app
      navigate("/app");
    } catch (err: any) {
      setError(err.message || "Failed to decline invitation");
    } finally {
      setProcessing(false);
    }
  };

  const handleLogin = () => {
    // Redirect to login
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate("/")} className="w-full">
            Go to Slate
          </Button>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 text-center">
          <Mail className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Page Shared with You</h1>
          <p className="text-blue-100 mt-2">You've been invited to view a page on Slate</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {invitation.page.title}
            </h2>
            <p className="text-gray-600">
              Shared by <span className="font-medium">{invitation.sharedBy.displayName}</span>
            </p>
          </div>

          {/* Permission Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2">
              {invitation.permission === "edit" ? (
                <>
                  <Edit3 className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-medium">You can edit this page</span>
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-600 font-medium">You can view this page</span>
                </>
              )}
            </div>
          </div>

          {/* Expiration Warning */}
          {isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">
                  This invitation has expired
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center mb-4">
                You need to sign in to accept this invitation
              </p>
              <Button onClick={handleLogin} className="w-full">
                Sign In to Accept
              </Button>
            </div>
          ) : isExpired ? (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                This invitation has expired and can no longer be accepted.
              </p>
              <Button onClick={() => navigate("/app")} variant="outline" className="w-full">
                Go to Slate
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={handleAccept}
                disabled={processing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {processing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Accepting...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Check className="w-4 h-4 mr-2" />
                    Accept Invitation
                  </div>
                )}
              </Button>
              <Button
                onClick={handleDecline}
                disabled={processing}
                variant="outline"
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              This invitation was sent from Slate. If you didn't expect this invitation, you can safely ignore it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
