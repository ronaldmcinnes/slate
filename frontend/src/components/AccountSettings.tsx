import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, User, LogOut, Sun, Moon, Check, Monitor } from "lucide-react";
import { resolveTheme, applyTheme, type Theme } from "@/lib/themeUtils";
import { useCanvasState } from "@/hooks/useCanvasState";

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

  // Customize Toolbar (moved from toolbar)
  const { state: canvasPrefs, setVisibleTools } = useCanvasState();
  const allTools = [
    { id: "eraser", label: "Eraser" },
    { id: "markers", label: "Markers" },
    { id: "highlighter", label: "Highlighter" },
    { id: "fountainPen", label: "Fountain Pen" },
    { id: "text", label: "Text Tool" },
    { id: "graph", label: "Add Graph" },
  ] as const;

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-background/50 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).dataset.accBackdrop === "true") onClose();
      }}
      data-acc-backdrop="true"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        data-acc-scroll
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5">
          <h2 className="text-2xl font-bold">Account Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
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

          {/* Theme Section (compact) */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleThemeClick(option.value)}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customize Toolbar (moved above logout) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">
                Customize Toolbar
              </label>
              <button
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                onClick={() =>
                  setVisibleTools({
                    ...canvasPrefs.visibleTools,
                    eraser: true,
                    markers: true,
                    highlighter: true,
                    fountainPen: true,
                    text: true,
                    graph: true,
                  })
                }
                title="Restore defaults"
              >
                Restore defaults
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Choose which tools appear on your canvas toolbar. Changes are
              saved automatically.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allTools.map((tool) => {
                const enabled = canvasPrefs.visibleTools[tool.id] !== false;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() =>
                      setVisibleTools({
                        ...canvasPrefs.visibleTools,
                        [tool.id]: !enabled ? true : false,
                      })
                    }
                    className={`flex items-center justify-between w-full rounded-md border px-3 py-2 text-left transition-colors ${
                      enabled
                        ? "bg-card/50 hover:bg-card border-border/50"
                        : "bg-muted/30 hover:bg-muted/40 border-border/40"
                    }`}
                  >
                    <span className="text-sm">{tool.label}</span>
                    <span
                      className={`inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        enabled ? "bg-primary/80" : "bg-border"
                      }`}
                      aria-hidden
                    >
                      <span
                        className={`h-4 w-4 bg-background rounded-full shadow transition-transform translate-x-0.5 ${
                          enabled ? "translate-x-[18px]" : ""
                        }`}
                      />
                    </span>
                    <span className="sr-only">
                      {enabled ? "Enabled" : "Disabled"}
                    </span>
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

          {/* Account Info */}
          <div className="text-[11px] text-muted-foreground space-y-1">
            <p>
              Member since:{" "}
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
      {/* Local scrollbar styling for this dialog */}
      <style>
        {`
          [data-acc-scroll]::-webkit-scrollbar { width: 10px; }
          [data-acc-scroll]::-webkit-scrollbar-track { background: transparent; }
          [data-acc-scroll]::-webkit-scrollbar-thumb {
            background-color: var(--border);
            border-radius: 9999px;
            border: 2px solid transparent;
            background-clip: padding-box;
          }
          [data-acc-scroll]::-webkit-scrollbar-thumb:hover {
            background-color: color-mix(in srgb, var(--border) 60%, transparent);
          }
          [data-acc-scroll] { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
        `}
      </style>
    </div>
  );
}
