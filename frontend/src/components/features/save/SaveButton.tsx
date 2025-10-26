import { Button } from "@/components/ui/button";

interface SaveButtonProps {
  hasUnsavedChanges: boolean;
  onSave: () => void;
  className?: string;
}

export default function SaveButton({
  hasUnsavedChanges,
  onSave,
  className = "h-9 w-9",
}: SaveButtonProps) {
  return (
    <Button
      variant={hasUnsavedChanges ? "default" : "ghost"}
      size="icon"
      className={`${className} ${
        hasUnsavedChanges
          ? "bg-blue-500 hover:bg-blue-600 text-white"
          : "hover:bg-muted"
      }`}
      onClick={onSave}
      title={
        hasUnsavedChanges
          ? "Save Page (Ctrl+S) - Unsaved Changes"
          : "Save Page (Ctrl+S)"
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17,21 17,13 7,13 7,21" />
        <polyline points="7,3 7,8 15,8" />
      </svg>
    </Button>
  );
}
