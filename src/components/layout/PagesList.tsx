import { useState } from "react";
import {
  Plus,
  FileText,
  Edit3,
  Trash2,
  Scissors,
  Copy,
  ClipboardPaste,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CreatePageDialog from "@/components/dialogs/CreatePageDialog";
import DropdownMenu from "@/components/menus/DropdownMenu";
import type { Page } from "@/types";

interface PagesListProps {
  pages: Page[];
  selectedPage: Page | null;
  onSelectPage: (page: Page) => void;
  onCreatePage: (title: string) => void;
  onDeletePage: (page: Page) => void;
  onRenamePage: (page: Page) => void;
  notebookSelected: boolean;
}

export default function PagesList({
  pages,
  selectedPage,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onRenamePage,
  notebookSelected,
}: PagesListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const getPageMenuItems = (page: Page) => [
    {
      icon: Edit3,
      label: "Rename",
      onClick: () => onRenamePage(page),
    },
    {
      icon: Trash2,
      label: "Delete",
      onClick: () => onDeletePage(page),
      variant: "destructive",
      separator: true,
    },
    {
      icon: Scissors,
      label: "Cut",
      disabled: true,
    },
    {
      icon: Copy,
      label: "Copy",
      disabled: true,
    },
    {
      icon: ClipboardPaste,
      label: "Paste",
      disabled: true,
    },
  ];

  return (
    <>
      <div className="w-full bg-muted/20 border-r border-border flex flex-col h-screen overflow-hidden">
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
                <div
                  key={page.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-md transition-all duration-150",
                    selectedPage?.id === page.id
                      ? "bg-card shadow-sm"
                      : "hover:bg-card/50"
                  )}
                >
                  <button
                    onClick={() => onSelectPage(page)}
                    className="flex-1 flex items-start gap-2 px-3 py-2.5 text-left"
                  >
                    <FileText
                      size={14}
                      className="mt-0.5 flex-shrink-0 text-muted-foreground"
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-sm truncate",
                          selectedPage?.id === page.id
                            ? "font-medium text-foreground"
                            : "text-foreground/80"
                        )}
                      >
                        {page.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(page.lastModified).toLocaleDateString()}
                      </div>
                    </div>
                  </button>

                  {/* Page Actions Menu */}
                  <DropdownMenu items={getPageMenuItems(page)} />
                </div>
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
