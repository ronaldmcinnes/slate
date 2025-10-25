// Type definitions for the Slate application

export interface Notebook {
  id: number;
  title: string;
  pages: Page[];
  createdAt: string;
}

export interface Page {
  id: number;
  title: string;
  createdAt: string;
  lastModified: string;
  content: string;
  drawings: any | null;
  graphs: Graph[];
  textBoxes: TextBox[];
}

export interface Graph {
  id: string;
  type: string;
  data: any;
  layout?: any;
  config?: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface TextBox {
  id: string;
  text: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  fontSize: number;
  fontFamily: string;
  color: string;
}

export interface DrawingData {
  paths: any[];
  width: number;
  height: number;
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'graph' | 'drawing';
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: any;
}

export interface ToolbarState {
  selectedTool: string;
  isDrawing: boolean;
  isSelecting: boolean;
}

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface PageDialogProps extends DialogProps {
  page: Page | null;
  onRename?: (page: Page, newTitle: string) => void;
  onConfirm?: () => void;
}

export interface CreateDialogProps extends DialogProps {
  onCreate: (title: string) => void;
}
