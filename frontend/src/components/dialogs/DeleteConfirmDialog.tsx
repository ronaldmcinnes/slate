import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  confirmButtonText?: string;
  confirmButtonVariant?:
    | "destructive"
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirm Delete",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  confirmButtonText = "Delete",
  confirmButtonVariant = "destructive",
}: DeleteConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {itemName ? (
              <>
                Are you sure you want to delete <strong>"{itemName}"</strong>?
                This action cannot be undone.
              </>
            ) : (
              description
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={confirmButtonVariant} onClick={handleConfirm}>
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
