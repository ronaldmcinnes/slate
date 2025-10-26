import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import CleanupButton from "@/components/features/cleanup/CleanupButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, User, LogOut, Sun, Moon, Check, Monitor } from "lucide-react";
import { resolveTheme, applyTheme, type Theme } from "@/lib/themeUtils";

interface AccountSettingsProps {
  onClose: () => void;
}

export default function AccountSettings({ onClose }: AccountSettingsProps) {
  const { user, refreshUser, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [theme, setTheme] = useState<Theme>(
    (user?.settings?.theme as Theme) || "light"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameJustSaved, setNameJustSaved] = useState(false);
  const nameSaveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setTheme((user.settings?.theme as Theme) || "light");
    }
  }, [user]);

  const applyThemeClass = (value: Theme) => {
    applyTheme(value);
  };

  const persistTheme = async (value: Theme) => {
    try {
      await api.updateSettings({ theme: value });
      await refreshUser();
    } catch (err) {
      console.error("Theme save failed", err);
      setError("Failed to save theme");
    }
  };

  const handleThemeClick = (value: Theme) => {
    setTheme(value);
    applyThemeClass(value);
    void persistTheme(value);
  };

  const saveDisplayName = async (name: string) => {
    setIsSaving(true);
    setError(null);
    try {
      await api.updateSettings({ displayName: name });
      await refreshUser();
      setNameJustSaved(true);
      window.setTimeout(() => setNameJustSaved(false), 1200);
    } catch (err: any) {
      console.error("Display name save failed", err);
      setError(err.message || "Failed to save display name.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Logout function in authContext should handle navigation
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
  ];

  return (
    <div className="fixed inset-0 bg-background/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Account Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.displayName}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary-foreground" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>

            <div>
              <label
                htmlFor="displayName"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                <span>Display Name</span>
                {nameJustSaved && <Check className="w-4 h-4 text-green-600" />}
              </label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => {
                  const val = e.target.value;
                  setDisplayName(val);
                  if (nameSaveTimeoutRef.current) {
                    window.clearTimeout(nameSaveTimeoutRef.current);
                  }
                  nameSaveTimeoutRef.current = window.setTimeout(() => {
                    void saveDisplayName(val.trim());
                  }, 600);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (nameSaveTimeoutRef.current) {
                      window.clearTimeout(nameSaveTimeoutRef.current);
                    }
                    void saveDisplayName(displayName.trim());
                  }
                }}
                placeholder="Your name"
              />
            </div>
          </div>

          {/* Theme Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Theme Preference
            </label>
            <div className="grid grid-cols-2 gap-4">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleThemeClick(option.value)}
                    className={`
                      flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all min-h-[80px]
                      ${
                        theme === option.value
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border hover:border-border/80 text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>

          {/* Storage Management */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Storage Management
            </h3>
            <CleanupButton />
          </div>

          {/* Account Info */}
          <div className="pt-4 border-t text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>
              Member since:{" "}
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
