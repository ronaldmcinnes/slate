import { useState } from "react";
import {
  Plus,
  BookOpen,
  User,
  Home,
  Settings,
  Users,
  NotebookPen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CreateNotebookDialog from "@/components/dialogs/CreateNotebookDialog";
import ShareNotebookDialog from "@/components/dialogs/ShareNotebookDialog";
import DeleteNotebookDialog from "@/components/dialogs/DeleteNotebookDialog";
import NotebookActionsMenu from "@/components/dialogs/NotebookActionsMenu";
import AccountSettings from "@/components/AccountSettings";
import { InlineLoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/lib/authContext";
import type { Notebook } from "@shared/types";

interface SidebarProps {
  notebooks: Notebook[];
  selectedNotebook: Notebook | null;
  onSelectNotebook: (notebook: Notebook) => void;
  onCreateNotebook: (title: string) => void;
  onNotebookChanged: () => void;
  onNavigateHome?: () => void;
  isLoading?: boolean;
  onLeaveNotebook?: (notebook: Notebook) => void;
}

export default function Sidebar({
  notebooks,
  selectedNotebook,
  onSelectNotebook,
  onCreateNotebook,
  onNotebookChanged,
  onNavigateHome,
  isLoading = false,
  onLeaveNotebook,
}: SidebarProps) {
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notebookToShare, setNotebookToShare] = useState<Notebook | null>(null);
  const [notebookToDelete, setNotebookToDelete] = useState<Notebook | null>(
    null
  );

  const handleShare = (notebook: Notebook) => {
    setNotebookToShare(notebook);
    setShareDialogOpen(true);
  };

  const handleDelete = (notebook: Notebook) => {
    setNotebookToDelete(notebook);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="w-full bg-card border-r border-border flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Slate
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Voice-Activated Teaching Canvas
              </p>
            </div>
            {onNavigateHome && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onNavigateHome}
                title="Go to Home"
              >
                <Home size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* Notebooks List */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Notebooks
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus size={14} />
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 px-4">
              <InlineLoadingSpinner text="Loading notebooks..." />
            </div>
          ) : notebooks.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-muted-foreground mb-3">
                No notebooks yet
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus size={14} />
                Create Notebook
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Personal Notebooks */}
              {notebooks.filter((notebook) => notebook.isOwner).length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                    Personal
                  </h3>
                  <div className="space-y-1">
                    {notebooks
                      .filter((notebook) => notebook.isOwner)
                      .map((notebook) => (
                        <div
                          key={notebook.id}
                          className={cn(
                            "group relative w-full text-left px-3 py-2.5 rounded-md transition-all duration-150 cursor-pointer",
                            selectedNotebook?.id === notebook.id
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-foreground hover:bg-muted"
                          )}
                          onClick={() => onSelectNotebook(notebook)}
                        >
                          <div className="flex items-center gap-2.5">
                            <NotebookPen
                              size={16}
                              className="flex-shrink-0 text-muted-foreground"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm truncate flex-1">
                                  {notebook.title}
                                </span>
                              </div>
                              {notebook.tags && notebook.tags.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {notebook.tags.join(", ")}
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0 flex items-center">
                              <NotebookActionsMenu
                                notebook={notebook}
                                onShare={handleShare}
                                onDelete={handleDelete}
                                onLeave={onLeaveNotebook}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Shared Notebooks */}
              {notebooks.filter((notebook) => !notebook.isOwner).length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                    Shared
                  </h3>
                  <div className="space-y-1">
                    {notebooks
                      .filter((notebook) => !notebook.isOwner)
                      .map((notebook) => (
                        <div
                          key={notebook.id}
                          className={cn(
                            "group relative w-full text-left px-3 py-2.5 rounded-md transition-all duration-150 cursor-pointer",
                            selectedNotebook?.id === notebook.id
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-foreground hover:bg-muted"
                          )}
                          onClick={() => onSelectNotebook(notebook)}
                        >
                          <div className="flex items-center gap-2.5">
                            <Users
                              size={16}
                              className="flex-shrink-0 text-muted-foreground"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm truncate flex-1">
                                  {notebook.title}
                                </span>
                              </div>
                              {notebook.tags && notebook.tags.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {notebook.tags.join(", ")}
                                </div>
                              )}
                              {notebook.permission === "view" && (
                                <div className="text-xs text-orange-600 mt-0.5">
                                  View only
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0 flex items-center">
                              <NotebookActionsMenu
                                notebook={notebook}
                                onShare={handleShare}
                                onDelete={handleDelete}
                                onLeave={onLeaveNotebook}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.displayName}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <User size={18} className="text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {user?.displayName || "User"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user?.email || ""}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setSettingsOpen(true)}
              title="Account Settings"
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>
      </div>

      <CreateNotebookDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={onCreateNotebook}
      />

      <ShareNotebookDialog
        notebook={notebookToShare}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        onShared={onNotebookChanged}
      />

      <DeleteNotebookDialog
        notebook={notebookToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDeleted={onNotebookChanged}
      />

      {settingsOpen && (
        <AccountSettings onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}
