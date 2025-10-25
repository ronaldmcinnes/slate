import { useState } from "react";
import { Plus, BookOpen, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CreateNotebookDialog from "@/components/dialogs/CreateNotebookDialog";
import type { Notebook } from "@/types";

interface SidebarProps {
  notebooks: Notebook[];
  selectedNotebook: Notebook | null;
  onSelectNotebook: (notebook: Notebook) => void;
  onCreateNotebook: (title: string) => void;
}

export default function Sidebar({
  notebooks,
  selectedNotebook,
  onSelectNotebook,
  onCreateNotebook,
}: SidebarProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <div className="w-full bg-card border-r border-border flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Slate
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Voice-Activated Teaching Canvas
          </p>
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

          {notebooks.length === 0 ? (
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
            <div className="space-y-1">
              {notebooks.map((notebook) => (
                <button
                  key={notebook.id}
                  onClick={() => onSelectNotebook(notebook)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-md transition-all duration-150",
                    selectedNotebook?.id === notebook.id
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <BookOpen
                      size={16}
                      className="mt-0.5 flex-shrink-0 text-muted-foreground"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{notebook.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {notebook.pages.length}{" "}
                        {notebook.pages.length === 1 ? "page" : "pages"}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <User size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">Educator</div>
              <div className="text-xs text-muted-foreground">Professor</div>
            </div>
          </div>
        </div>
      </div>

      <CreateNotebookDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={onCreateNotebook}
      />
    </>
  );
}
