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
import { InlineLoadingSpinner } from "@/components/ui/loading-spinner";
import { useClipboard } from "@/lib/clipboardContext";
import { useToast } from "@/lib/toastContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { Page } from "@/types";

interface PagesListProps {
  pages: Page[];
  selectedPage: Page | null;
  onSelectPage: (page: Page) => void;
  onCreatePage: (title: string) => void;
  onDeletePage: (page: Page) => void;
  onRenamePage: (page: Page) => void;
  onPageAdded?: (page: Page) => void;
  onPageDeleted?: (pageId: string) => void;
  notebookSelected: boolean;
  notebookId?: string;
  isLoading?: boolean;
}

export default function PagesList({
  pages,
  selectedPage,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onRenamePage,
  onPageAdded,
  onPageDeleted,
  notebookSelected,
  notebookId,
  isLoading = false,
}: PagesListProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { addToast } = useToast();
  const { copyPage, cutPageAction, pastePage, hasCopiedPage, hasCutPage } =
    useClipboard();

  // Add keyboard shortcuts
  useKeyboardShortcuts({
    selectedPage,
    notebookId,
    onPageAdded,
    onDeletePage,
  });

  const handleCopyPage = (page: Page) => {
    copyPage(page);
    addToast({
      title: "Page Copied",
      description: `"${page.title}" has been copied to clipboard`,
      type: "success",
    });
  };

  const handleCutPage = (page: Page) => {
    cutPageAction(page);
    addToast({
      title: "Page Cut",
      description: `"${page.title}" has been cut and ready to paste`,
      type: "success",
    });
  };

  const handlePastePage = async () => {
    if (!notebookId) {
      addToast({
        title: "Cannot Paste",
        description: "No notebook selected",
        type: "error",
      });
      return;
    }

    try {
      const newPage = await pastePage(notebookId, onPageDeleted);
      if (newPage && onPageAdded) {
        onPageAdded(newPage);
        addToast({
          title: "Page Pasted",
          description: `"${newPage.title}" has been pasted`,
          type: "success",
        });
      }
    } catch (error) {
      addToast({
        title: "Paste Failed",
        description: "Failed to paste page",
        type: "error",
      });
    }
  };

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
      onClick: () => handleCutPage(page),
    },
    {
      icon: Copy,
      label: "Copy",
      onClick: () => handleCopyPage(page),
    },
    {
      icon: ClipboardPaste,
      label: "Paste",
      onClick: handlePastePage,
      disabled: !hasCopiedPage && !hasCutPage,
    },
  ];

  return (
    <>
      <div data-pages-list className="w-full bg-muted/20 border-r border-border flex flex-col h-screen overflow-hidden">
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
          ) : isLoading ? (
            <div className="text-center py-8 px-4">
              <InlineLoadingSpinner text="Loading pages..." />
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
