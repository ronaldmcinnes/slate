// Type definitions for the Slate application

export interface Notebook {
  id: number;
  title: string;
  pages: Page[];
  createdAt: string;
}

export interface Page {
  id: string;
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
  type: "text" | "graph" | "drawing";
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

// Base interface for all graph types
export interface BaseGraphSpec {
  version: string;
  graphType: 'mathematical' | 'chart' | 'statistical';
  title?: string;
  style?: {
    lineWidth?: number;
    showGrid?: boolean;
    theme?: 'light' | 'dark' | 'system';
    color?: string;
  };
}

// Mathematical graphs (3D, functions, integrals)
export interface MathematicalGraphSpec extends BaseGraphSpec {
  graphType: 'mathematical';
  plot: {
    kind:
      | "2d_explicit"
      | "2d_parametric"
      | "2d_polar"
      | "2d_inequality"
      | "3d_surface"
      | "2d_integral"
      | "3d_integral";
    title?: string;
    xLabel?: string;
    yLabel?: string;
    zLabel?: string;
    domain: {
      x?: [number, number];
      y?: [number, number];
      z?: [number, number];
      t?: [number, number];
      r?: [number, number];
      theta?: [number, number];
      phi?: [number, number];
    };
    resolution?: number;
    expressions: {
      yOfX?: string;
      xOfT?: string;
      yOfT?: string;
      rOfTheta?: string;
      theta?: string;
      surfaceZ?: string;
      inequality?: string;
      cylindricalZ?: string; // For cylindrical coordinates
      sphericalR?: string;   // For spherical coordinates
    };
    integral?: {
      function: string;
      function2?: string;
      variable: string;
      lowerBound: number | string;
      upperBound: number | string;
      showArea?: boolean;
      areaColor?: string;
      areaOpacity?: number;
      betweenFunctions?: boolean; // Flag to indicate between-two-functions integral
    };
    style?: {
      lineWidth?: number;
      showGrid?: boolean;
      theme?: "light" | "dark" | "system";
      color?: string;
    };
  };
}
