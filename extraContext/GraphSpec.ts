// JSON Schema for function graphing data from GPT-5
export interface GraphSpec {
  version: string;
  plot: {
    kind: '2d_explicit' | '2d_parametric' | '2d_polar' | '2d_inequality' | '3d_surface' | '2d_integral' | '3d_integral';
    title?: string;
    xLabel?: string;
    yLabel?: string;
    zLabel?: string;
    domain: {
      x?: [number, number];
      y?: [number, number];
      t?: [number, number];
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
    };
    integral?: {
      function: string;
      function2?: string; // Second function for between-two-functions integrals
      variable: string;
      lowerBound: number;
      upperBound: number;
      showArea?: boolean;
      areaColor?: string;
      areaOpacity?: number;
      betweenFunctions?: boolean; // Flag to indicate between-two-functions integral
    };
    style?: {
      lineWidth?: number;
      showGrid?: boolean;
      theme?: 'light' | 'dark' | 'system';
      color?: string;
    };
  };
}

// Example GraphSpec for testing
export const exampleGraphSpec: GraphSpec = {
  version: "1.0",
  plot: {
    kind: "2d_explicit",
    title: "y = x^2",
    xLabel: "x",
    yLabel: "y",
    domain: { x: [-5, 5] },
    resolution: 200,
    expressions: { yOfX: "x^2" },
    style: {
      lineWidth: 2,
      showGrid: true,
      theme: "light",
      color: "#3b82f6"
    }
  }
};
