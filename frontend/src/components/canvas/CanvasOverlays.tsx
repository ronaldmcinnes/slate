import DraggableGraph from "./DraggableGraph";
import TextBox from "./TextBox";
import type { Page } from "@/types";

interface CanvasOverlaysProps {
  page: Page;
  onUpdateTextBoxPosition: (textBoxId: string, x: number, y: number) => void;
  onUpdateTextBoxText: (textBoxId: string, text: string) => void;
  onRemoveTextBox: (textBoxId: string) => void;
  onUpdateGraphPosition: (graphId: string, x: number, y: number) => void;
  onRemoveGraph: (graphId: string) => void;
  onUpdateGraph: (graphId: string, newGraphSpec: any) => void;
  onSizeChange: (graphId: string, width: number, height: number) => void;
  onCameraChange: (
    graphId: string,
    cameraState: {
      position: [number, number, number];
      rotation: [number, number, number];
      zoom: number;
    }
  ) => void;
  isReadOnly?: boolean;
  viewport?: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
  };
}

export default function CanvasOverlays({
  page,
  onUpdateTextBoxPosition,
  onUpdateTextBoxText,
  onRemoveTextBox,
  onUpdateGraphPosition,
  onRemoveGraph,
  onUpdateGraph,
  onSizeChange,
  onCameraChange,
  isReadOnly = false,
  viewport,
}: CanvasOverlaysProps) {
  // Adapter functions to convert between main types and component interfaces
  const convertTextBoxForComponent = (textBox: any) => ({
    id: textBox.id,
    x: textBox.position?.x || textBox.x || 100,
    y: textBox.position?.y || textBox.y || 100,
    text: textBox.text || "",
  });

  const convertGraphForComponent = (graph: any) => {
    return {
      id: graph.id,
      x: graph.position?.x || graph.x || 100,
      y: graph.position?.y || graph.y || 100,
      title: graph.graphSpec?.plot?.title || graph.title || "Graph",
      data: graph.data || [],
      layout: graph.layout || {},
      graphSpec: graph.graphSpec,
      size: graph.size || { width: 500, height: 400 },
      cameraState: graph.cameraState,
    };
  };

  return (
    <>
      {/* Text Boxes Overlay */}
      {page.textBoxes && page.textBoxes.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative w-full h-full">
            {page.textBoxes.map(
              (textBox) =>
                textBox && (
                  <TextBox
                    key={textBox.id}
                    textBox={convertTextBoxForComponent(textBox)}
                    onPositionChange={onUpdateTextBoxPosition}
                    onTextChange={onUpdateTextBoxText}
                    onRemove={onRemoveTextBox}
                    isReadOnly={isReadOnly}
                  />
                )
            )}
          </div>
        </div>
      )}

      {/* Interactive Graphs Overlay */}
      {page.graphs && page.graphs.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative w-full h-full">
            {page.graphs.map(
              (graph) =>
                graph && (
                  <DraggableGraph
                    key={graph.id}
                    graph={convertGraphForComponent(graph)}
                    onPositionChange={onUpdateGraphPosition}
                    onRemove={onRemoveGraph}
                    onUpdateGraph={onUpdateGraph}
                    onSizeChange={onSizeChange}
                    onCameraChange={onCameraChange}
                    isReadOnly={isReadOnly}
                    viewport={viewport}
                    graphCount={page.graphs?.length || 0}
                  />
                )
            )}
          </div>
        </div>
      )}
    </>
  );
}
