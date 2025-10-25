import { MoreVertical, Share2, Trash2, Edit, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notebook } from "@shared/types";

interface NotebookActionsMenuProps {
  notebook: Notebook;
  onShare: (notebook: Notebook) => void;
  onDelete: (notebook: Notebook) => void;
}

export default function NotebookActionsMenu({
  notebook,
  onShare,
  onDelete,
}: NotebookActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {notebook.isOwner && (
          <>
            <DropdownMenuItem onClick={() => onShare(notebook)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(notebook)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
        {!notebook.isOwner && (
          <DropdownMenuItem disabled>
            <Users className="mr-2 h-4 w-4" />
            Shared with you
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
