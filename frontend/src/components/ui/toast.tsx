import { useEffect, useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { useToast, Toast } from "@/lib/toastContext";
import { cn } from "@/lib/utils";

const TOAST_DURATION = 30000; // 30 seconds

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 space-y-3 z-1 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [timeLeft, setTimeLeft] = useState(TOAST_DURATION);
  const [isUndoing, setIsUndoing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          onRemove(toast.id);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [toast.id, onRemove]);

  const handleUndo = async () => {
    if (!toast.onUndo) return;
    setIsUndoing(true);
    try {
      await toast.onUndo();
      onRemove(toast.id);
    } catch (error) {
      console.error("Error undoing delete:", error);
      setIsUndoing(false);
    }
  };

  const progressPercent = (timeLeft / TOAST_DURATION) * 100;

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg shadow-lg p-4 pointer-events-auto",
        "animate-in slide-in-from-right-full duration-200",
        "max-w-sm"
      )}
    >
      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-destructive rounded-b-lg transition-all duration-100"
        style={{ width: `${progressPercent}%` }}
      />

      <div className="pr-8">
        <p className="text-sm font-medium text-foreground">
          Deleted <span className="font-semibold">{toast.itemName}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {Math.ceil(timeLeft / 1000)}s
        </p>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleUndo}
          disabled={isUndoing}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium",
            "rounded-md transition-colors",
            isUndoing
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          )}
        >
          <RotateCcw size={14} />
          Undo
        </button>
        <button
          onClick={() => onRemove(toast.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X size={14} />
          Dismiss
        </button>
      </div>
    </div>
  );
}
