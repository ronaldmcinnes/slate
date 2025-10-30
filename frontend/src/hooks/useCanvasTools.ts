import { useCallback } from "react";
import type { Page } from "@/types";

interface UseCanvasToolsProps {
  page: Page | null;
  onUpdatePage: (updates: Partial<Page>) => void;
  markAsChanged: () => void;
  setTool: (tool: string) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
}

export function useCanvasTools({
  page,
  onUpdatePage,
  markAsChanged,
  setTool,
  setStrokeColor,
  setStrokeWidth,
}: UseCanvasToolsProps) {
  const handleToolChange = useCallback(
    (newTool: string, color: string, width: number) => {
      setTool(newTool);
      setStrokeColor(color);
      setStrokeWidth(width);
    },
    [setTool, setStrokeColor, setStrokeWidth]
  );

  const handleAddGraph = useCallback(
    (graphData: any) => {
      if (!page) return;

      const graphs = page.graphs || [];
      const newGraph = {
        id: Date.now().toString(),
        type: graphData.type || "mathematical",
        data: graphData,
        layout: {},
        position: { x: graphData.x || 100, y: graphData.y || 100 },
        size: { width: 500, height: 400 },
        graphSpec: graphData,
      };
      graphs.push(newGraph);
      onUpdatePage({ graphs });
      markAsChanged();
    },
    [page, onUpdatePage, markAsChanged]
  );

  const handleRemoveGraph = useCallback(
    (graphId: string) => {
      console.log("handleRemoveGraph called with graphId:", graphId);
      console.log("Graph ID type:", typeof graphId);
      if (!page) {
        console.log("No page found, cannot remove graph");
        return;
      }

      console.log("Current graphs:", page.graphs);
      console.log(
        "Graph IDs in page:",
        page.graphs?.map((g) => ({ id: g.id, type: typeof g.id }))
      );
      const graphs = (page.graphs || []).filter((g) => {
        console.log(
          `Comparing ${
            g.id
          } (${typeof g.id}) with ${graphId} (${typeof graphId})`
        );
        return g.id !== graphId;
      });
      console.log("Filtered graphs:", graphs);
      onUpdatePage({ graphs });
      markAsChanged();
      console.log("Graph removal completed");
    },
    [page, onUpdatePage, markAsChanged]
  );

  const handleUpdateGraphPosition = useCallback(
    (graphId: string, x: number, y: number) => {
      if (!page) return;

      const graphs = page.graphs.map((g) =>
        g.id === graphId ? { ...g, position: { x, y } } : g
      );
      onUpdatePage({ graphs });
      markAsChanged();
    },
    [page, onUpdatePage, markAsChanged]
  );

  const handleUpdateGraph = useCallback(
    (graphId: string, newGraphSpec: any) => {
      if (!page) return;

      const graphs = page.graphs.map((g) =>
        g.id === graphId
          ? { ...g, graphSpec: newGraphSpec, data: newGraphSpec }
          : g
      );
      onUpdatePage({ graphs });
      markAsChanged();
    },
    [page, onUpdatePage, markAsChanged]
  );

  const handleCameraChange = useCallback(
    (
      graphId: string,
      cameraState: {
        position: [number, number, number];
        rotation: [number, number, number];
        zoom: number;
      }
    ) => {
      if (!page) return;

      const graphs = page.graphs.map((g) =>
        g.id === graphId ? { ...g, cameraState } : g
      );
      onUpdatePage({ graphs });
      markAsChanged();
    },
    [page, onUpdatePage, markAsChanged]
  );

  const handleSizeChange = useCallback(
    (graphId: string, width: number, height: number) => {
      if (!page) return;

      const graphs = page.graphs.map((g) =>
        g.id === graphId ? { ...g, size: { width, height } } : g
      );
      onUpdatePage({ graphs });
      markAsChanged();
    },
    [page, onUpdatePage, markAsChanged]
  );

  const handleAddTextBoxAt = useCallback(
    (x: number, y: number) => {
      if (!page) return;

      const textBoxes = page.textBoxes || [];
      const newTextBox = {
        id: Date.now().toString(),
        text: "",
        position: { x: x - 100, y: y - 30 },
        size: { width: 200, height: 60 },
        fontSize: 16,
        fontFamily: "Arial",
        color: "#000000",
      };
      textBoxes.push(newTextBox);
      onUpdatePage({ textBoxes });
      markAsChanged();

      // Switch to pan tool after placing text
      setTool("pan");
    },
    [page, onUpdatePage, markAsChanged, setTool]
  );

  const handleRemoveTextBox = useCallback(
    (textBoxId: string) => {
      if (!page) return;

      const textBoxes = (page.textBoxes || []).filter(
        (t) => t.id !== textBoxId
      );
      onUpdatePage({ textBoxes });
      markAsChanged();
    },
    [page, onUpdatePage, markAsChanged]
  );

  const handleUpdateTextBoxPosition = useCallback(
    (textBoxId: string, x: number, y: number) => {
      if (!page) return;

      const textBoxes = (page.textBoxes || []).map((t) =>
        t.id === textBoxId ? { ...t, position: { x, y } } : t
      );
      onUpdatePage({ textBoxes });
      markAsChanged();
    },
    [page, onUpdatePage, markAsChanged]
  );

  const handleUpdateTextBoxText = useCallback(
    (textBoxId: string, text: string) => {
      if (!page) return;

      const textBoxes = (page.textBoxes || []).map((t) =>
        t.id === textBoxId ? { ...t, text } : t
      );
      onUpdatePage({ textBoxes });
      markAsChanged();
    },
    [page, onUpdatePage, markAsChanged]
  );

  return {
    handleToolChange,
    handleAddGraph,
    handleRemoveGraph,
    handleUpdateGraphPosition,
    handleUpdateGraph,
    handleCameraChange,
    handleSizeChange,
    handleAddTextBoxAt,
    handleRemoveTextBox,
    handleUpdateTextBoxPosition,
    handleUpdateTextBoxText,
  };
}
