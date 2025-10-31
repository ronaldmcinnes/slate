import { useEffect, useRef } from "react";

interface CanvasTitleProps {
  page: {
    title: string;
    createdAt?: string;
  };
  isEditingTitle: boolean;
  tempTitle: string;
  onStartEditing: () => void;
  onTitleChange: (title: string) => void;
  onFinishEditing: () => void;
  onCancelEditing: () => void;
  hasUnsavedChanges: boolean;
  isReadOnly: boolean;
  isSaving?: boolean;
  saveSuccess?: boolean;
}

export default function CanvasTitle({
  page,
  isEditingTitle,
  tempTitle,
  onStartEditing,
  onTitleChange,
  onFinishEditing,
  onCancelEditing,
  hasUnsavedChanges,
  isReadOnly,
  isSaving = false,
  saveSuccess = false,
}: CanvasTitleProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing title
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      const input = titleInputRef.current;
      // Use requestAnimationFrame to avoid blocking
      requestAnimationFrame(() => {
        input.focus();
        // Position cursor at end of text
        input.setSelectionRange(input.value.length, input.value.length);
      });
    }
  }, [isEditingTitle]);

  return (
    <div className="absolute top-6 left-6 z-10 pointer-events-auto">
      <div>
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={tempTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={() => {
              if (tempTitle.trim()) {
                onFinishEditing();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (tempTitle.trim()) {
                  onFinishEditing();
                }
              } else if (e.key === "Escape") {
                onCancelEditing();
              }
            }}
            className="m-0 text-3xl font-bold text-foreground bg-transparent outline-none"
            autoComplete="off"
            autoFocus
          />
        ) : (
          <h1
            onClick={() => {
              if (!isReadOnly) {
                onStartEditing();
              }
            }}
            className={`m-0 text-3xl font-bold text-foreground ${
              isReadOnly ? "" : "cursor-text"
            }`}
          >
            {tempTitle || page.title}
          </h1>
        )}
        {page.createdAt && (
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">
              {new Date(page.createdAt).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            {!isReadOnly && (
              <>
                {isSaving ? (
                  <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : !hasUnsavedChanges ? (
                  <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400 flex-shrink-0" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400 flex-shrink-0" />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
