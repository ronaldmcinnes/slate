import React, { createContext, useContext, useState, useCallback } from "react";
import type { Page } from "@/types";

interface ClipboardContextType {
  copiedPage: Page | null;
  cutPage: Page | null;
  copyPage: (page: Page) => void;
  cutPageAction: (page: Page) => void;
  pastePage: (
    notebookId: string,
    onPageDeleted?: (pageId: string) => void
  ) => Promise<Page | null>;
  clearClipboard: () => void;
  hasCopiedPage: boolean;
  hasCutPage: boolean;
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(
  undefined
);

export const ClipboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [copiedPage, setCopiedPage] = useState<Page | null>(null);
  const [cutPage, setCutPage] = useState<Page | null>(null);

  const copyPage = useCallback((page: Page) => {
    setCopiedPage(page);
    setCutPage(null); // Clear cut when copying
  }, []);

  const cutPageAction = useCallback((page: Page) => {
    setCutPage(page);
    setCopiedPage(null); // Clear copy when cutting
  }, []);

  const pastePage = useCallback(
    async (
      notebookId: string,
      onPageDeleted?: (pageId: string) => void
    ): Promise<Page | null> => {
      if (!copiedPage && !cutPage) return null;

      const sourcePage = copiedPage || cutPage;
      if (!sourcePage) return null;

      try {
        // Import the API client
        const { api } = await import("@/lib/api");

        // Create a new page with the same content but new title
        const newPageData = {
          title: `${sourcePage.title} (Copy)`,
          content: sourcePage.content,
          drawings: sourcePage.drawings,
          graphs: sourcePage.graphs,
          textBoxes: sourcePage.textBoxes,
        };

        const newPage = await api.createPage(notebookId, newPageData);

        // If this was a cut operation, delete the original page and notify the parent
        if (cutPage) {
          try {
            await api.deletePageSilently(cutPage.id);
            // Notify parent component to update UI without showing toast
            if (onPageDeleted) {
              onPageDeleted(cutPage.id);
            }
          } catch (error) {
            console.error("Failed to delete cut page:", error);
            // Don't throw here as we've already created the new page
          }
          setCutPage(null);
        }

        // Clear clipboard after paste
        setCopiedPage(null);

        return newPage;
      } catch (error) {
        console.error("Failed to paste page:", error);
        return null;
      }
    },
    [copiedPage, cutPage]
  );

  const clearClipboard = useCallback(() => {
    setCopiedPage(null);
    setCutPage(null);
  }, []);

  const hasCopiedPage = copiedPage !== null;
  const hasCutPage = cutPage !== null;

  return (
    <ClipboardContext.Provider
      value={{
        copiedPage,
        cutPage,
        copyPage,
        cutPageAction,
        pastePage,
        clearClipboard,
        hasCopiedPage,
        hasCutPage,
      }}
    >
      {children}
    </ClipboardContext.Provider>
  );
};

export const useClipboard = () => {
  const context = useContext(ClipboardContext);
  if (context === undefined) {
    throw new Error("useClipboard must be used within a ClipboardProvider");
  }
  return context;
};
