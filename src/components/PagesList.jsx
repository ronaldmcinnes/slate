import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CreatePageDialog from "./CreatePageDialog";

export default function PagesList({
  pages,
  selectedPage,
  onSelectPage,
  onCreatePage,
  notebookSelected,
}) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <div className="w-56 bg-muted/20 border-r border-border flex flex-col h-screen">
        {/* Header */}
        <div className="p-3 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Pages</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setCreateDialogOpen(true)}
              disabled={!notebookSelected}
            >
              <Plus size={14} />
            </Button>
          </div>
        </div>

        {/* Pages List */}
        <div className="flex-1 overflow-y-auto p-2">
          {!notebookSelected ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-muted-foreground">Select a notebook</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-muted-foreground mb-3">No pages yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus size={14} />
                Create Page
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => onSelectPage(page)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-md transition-all duration-150",
                    selectedPage?.id === page.id
                      ? "bg-card text-foreground shadow-sm font-medium"
                      : "text-foreground/80 hover:bg-card/50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <FileText
                      size={14}
                      className="mt-0.5 flex-shrink-0 text-muted-foreground"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{page.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(page.lastModified).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreatePageDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={onCreatePage}
      />
    </>
  );
}
