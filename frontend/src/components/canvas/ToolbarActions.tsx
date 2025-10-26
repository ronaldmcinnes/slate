import { LineChart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolbarActionsProps {
  onAddGraph: () => void;
  onSharePage?: () => void;
  visibleTools?: Record<string, boolean>;
}

export default function ToolbarActions({ 
  onAddGraph, 
  onSharePage,
  visibleTools = {} 
}: ToolbarActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {visibleTools.graph !== false && (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-muted"
          onClick={onAddGraph}
          title="Add Graph"
        >
          <LineChart size={18} />
        </Button>
      )}
      
      {onSharePage && (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-muted"
          onClick={onSharePage}
          title="Share Page"
        >
          <Share2 size={18} />
        </Button>
      )}
    </div>
  );
}
