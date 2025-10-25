import { LineChart, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolbarActionsProps {
  onAddGraph: () => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  isRecording?: boolean;
  visibleTools?: Record<string, boolean>;
}

export default function ToolbarActions({ 
  onAddGraph, 
  onStartRecording, 
  onStopRecording, 
  isRecording = false, 
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
      
      {visibleTools.microphone !== false && (
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 hover:bg-muted ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
          onMouseDown={onStartRecording}
          onMouseUp={onStopRecording}
          onTouchStart={onStartRecording}
          onTouchEnd={onStopRecording}
          title={isRecording ? "Release to stop recording" : "Hold to record audio"}
        >
          <Mic size={18} />
        </Button>
      )}
    </div>
  );
}
