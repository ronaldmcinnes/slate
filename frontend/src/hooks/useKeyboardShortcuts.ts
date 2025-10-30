import { useEffect } from "react";
import { useClipboard } from "@/lib/clipboardContext";
import { useToast } from "@/lib/toastContext";
import type { Page } from "@/types";

interface UseKeyboardShortcutsProps {
  selectedPage: Page | null;
  notebookId?: string;
  onPageAdded?: (page: Page) => void;
  onDeletePage?: (page: Page) => void;
}

export function useKeyboardShortcuts({
  selectedPage,
  notebookId,
  onPageAdded,
  onDeletePage,
}: UseKeyboardShortcutsProps) {
  const { addToast } = useToast();
  const { copyPage, cutPageAction, pastePage, hasCopiedPage, hasCutPage } =
    useClipboard();

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Check for Ctrl/Cmd + X (Cut)
      if ((event.ctrlKey || event.metaKey) && event.key === "x") {
        if (selectedPage) {
          event.preventDefault();
          cutPageAction(selectedPage);
          addToast({
            title: "Page Cut",
            description: `"${selectedPage.title}" has been cut and ready to paste`,
            type: "success",
          });
        }
        return;
      }

      // Check for Ctrl/Cmd + C (Copy)
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        if (selectedPage) {
          event.preventDefault();
          copyPage(selectedPage);
          addToast({
            title: "Page Copied",
            description: `"${selectedPage.title}" has been copied to clipboard`,
            type: "success",
          });
        }
        return;
      }

      // Check for Ctrl/Cmd + V (Paste)
      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        if (notebookId && (hasCopiedPage || hasCutPage)) {
          event.preventDefault();
          try {
            const newPage = await pastePage(notebookId);
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
        }
        return;
      }

      // Check for Delete key (only when Pages list is hovered/focused)
      if (event.key === "Delete" && selectedPage) {
        const pagesListHovered = !!document.querySelector('[data-pages-list]:hover');
        const activeEl = document.activeElement as HTMLElement | null;
        const pagesListFocused = !!activeEl?.closest?.('[data-pages-list]');
        if (pagesListHovered || pagesListFocused) {
          event.preventDefault();
          if (onDeletePage) {
            onDeletePage(selectedPage);
          }
          return;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedPage,
    notebookId,
    onPageAdded,
    onDeletePage,
    copyPage,
    cutPageAction,
    pastePage,
    hasCopiedPage,
    hasCutPage,
    addToast,
  ]);
}
