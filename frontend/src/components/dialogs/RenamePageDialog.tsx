import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { PageDialogProps } from "@/types";

export default function RenamePageDialog({
  page,
  open,
  onOpenChange,
  onRename,
}: PageDialogProps) {
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (page) {
      setTitle(page.title);
    }
  }, [page]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && title !== page?.title && page && onRename) {
      onRename(page, title.trim());
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Rename Page</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <Input
              placeholder="Page title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || title === page?.title}
            >
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
