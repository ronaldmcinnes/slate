import { Mic, MicOff, Sparkles, Download, LineChart, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ToolbarActions({
  isRecording,
  onToggleRecording,
  onAddTextBox,
  onAddGraph,
  onExport,
  onGenerate,
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onAddTextBox}
        title="Add text box"
      >
        <Type size={16} />
        Text
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onAddGraph}
        title="Add graph"
      >
        <LineChart size={16} />
        Graph
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        onClick={onToggleRecording}
        variant={isRecording ? "destructive" : "default"}
        size="sm"
      >
        {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
        {isRecording ? "Stop" : "Record"}
      </Button>

      <Button variant="outline" size="sm" onClick={onGenerate}>
        <Sparkles size={16} />
        Generate
      </Button>

      <Button variant="ghost" size="icon" onClick={onExport} title="Export">
        <Download size={16} />
      </Button>
    </div>
  );
}
