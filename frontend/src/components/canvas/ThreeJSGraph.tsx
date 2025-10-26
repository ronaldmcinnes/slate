import React, { useRef, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type { GraphSpec, MathematicalGraphSpec, ChartGraphSpec, StatisticalGraphSpec } from '@/types';

// Error boundary for Three.js Canvas
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ThreeJSErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Three.js Canvas Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <div className="text-center p-4">
            <div className="text-red-500 text-lg font-semibold mb-2">Graph Rendering Error</div>
            <div className="text-gray-600 text-sm">
              {this.state.error?.message || 'An error occurred while rendering the graph'}
            </div>
            <button 
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ThreeJSGraphProps {
  graphSpec: GraphSpec;
  width?: number;
  height?: number;
}

// Validate GraphSpec to prevent Canvas errors
const validateGraphSpec = (graphSpec: GraphSpec): boolean => {
  if (!graphSpec) {
    console.error('Invalid GraphSpec: missing graphSpec');
    return false;
  }

  // Check graphType
  if (!graphSpec.graphType) {
    console.error('Invalid GraphSpec: missing graphType');
    return false;
  }

  // Validate based on graph type
  switch (graphSpec.graphType) {
    case 'mathematical':
      return validateMathematicalGraphSpec(graphSpec as MathematicalGraphSpec);
    case 'chart':
      return validateChartGraphSpec(graphSpec as ChartGraphSpec);
    case 'statistical':
      return validateStatisticalGraphSpec(graphSpec as StatisticalGraphSpec);
    default:
      console.error('Invalid GraphSpec: unknown graphType', (graphSpec as any).graphType);
      return false;
  }
};

const validateMathematicalGraphSpec = (graphSpec: MathematicalGraphSpec): boolean => {
  if (!graphSpec.plot) {
    console.error('Invalid MathematicalGraphSpec: missing plot property');
    return false;
  }

  const { plot } = graphSpec;
  
  // Check required properties
  if (!plot.kind) {
    console.error('Invalid MathematicalGraphSpec: missing plot.kind');
    return false;
  }

  // Validate domain
  if (plot.domain) {
    const domainKeys = ['x', 'y', 'z', 't', 'r', 'theta', 'phi'] as const;
    for (const key of domainKeys) {
      if (plot.domain[key] && (!Array.isArray(plot.domain[key]) || plot.domain[key]!.length !== 2)) {
        console.error(`Invalid MathematicalGraphSpec: domain.${key} must be [min, max] array`);
        return false;
      }
    }
  }

  // Validate expressions based on kind
  if (plot.expressions) {
    switch (plot.kind) {
      case '2d_explicit':
        if (!plot.expressions.yOfX) {
          console.error('Invalid MathematicalGraphSpec: 2d_explicit requires yOfX expression');
          return false;
        }
        break;
      case '2d_parametric':
        if (!plot.expressions.xOfT || !plot.expressions.yOfT) {
          console.error('Invalid MathematicalGraphSpec: 2d_parametric requires xOfT and yOfT expressions');
          return false;
        }
        break;
      case '2d_polar':
        if (!plot.expressions.rOfTheta) {
          console.error('Invalid MathematicalGraphSpec: 2d_polar requires rOfTheta expression');
          return false;
        }
        break;
      case '3d_surface':
        if (!plot.expressions.surfaceZ) {
          console.error('Invalid MathematicalGraphSpec: 3d_surface requires surfaceZ expression');
          return false;
        }
        break;
      case 'cylindrical_integral':
        if (!plot.expressions.cylindricalZ) {
          console.error('Invalid MathematicalGraphSpec: cylindrical_integral requires cylindricalZ expression');
          return false;
        }
        break;
      case 'spherical_integral':
        if (!plot.expressions.sphericalR) {
          console.error('Invalid MathematicalGraphSpec: spherical_integral requires sphericalR expression');
          return false;
        }
        break;
    }
  }

  return true;
};

const validateChartGraphSpec = (graphSpec: ChartGraphSpec): boolean => {
  if (!graphSpec.chart) {
    console.error('Invalid ChartGraphSpec: missing chart property');
    return false;
  }

  const { chart } = graphSpec;
  
  if (!chart.kind) {
    console.error('Invalid ChartGraphSpec: missing chart.kind');
    return false;
  }

  if (!chart.data || !chart.data.datasets || chart.data.datasets.length === 0) {
    console.error('Invalid ChartGraphSpec: missing or empty datasets');
    return false;
  }

  return true;
};

const validateStatisticalGraphSpec = (graphSpec: StatisticalGraphSpec): boolean => {
  if (!graphSpec.statistics) {
    console.error('Invalid StatisticalGraphSpec: missing statistics property');
    return false;
  }

  const { statistics } = graphSpec;
  
  if (!statistics.kind) {
    console.error('Invalid StatisticalGraphSpec: missing statistics.kind');
    return false;
  }

  if (!statistics.data || (Array.isArray(statistics.data) && statistics.data.length === 0)) {
    console.error('Invalid StatisticalGraphSpec: missing or empty data');
    return false;
  }

  return true;
};

// Function to evaluate mathematical expressions safely
const evaluateExpression = (expression: string, variable: string, value: number, variable2?: string, value2?: number): number => {
  try {
    // Clean the expression and replace common mathematical notation
    let cleanExpression = expression
      .replace(/\^/g, '**')  // Replace ^ with ** for exponentiation
      .replace(/\bpi\b/g, 'Math.PI')  // Replace pi with Math.PI
      .replace(/\be\b/g, 'Math.E');   // Replace e with Math.E
    
    // Add Math functions to the scope
    const mathScope = {
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      asin: Math.asin,
      acos: Math.acos,
      atan: Math.atan,
      exp: Math.exp,
      log: Math.log,
      log10: Math.log10,
      sqrt: Math.sqrt,
      abs: Math.abs,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      min: Math.min,
      max: Math.max,
      pow: Math.pow,
      Math: Math
    };
    
    if (variable2 !== undefined && value2 !== undefined) {
      const func = new Function(variable, variable2, ...Object.keys(mathScope), `return ${cleanExpression}`);
      return func(value, value2, ...Object.values(mathScope));
    } else {
      const func = new Function(variable, ...Object.keys(mathScope), `return ${cleanExpression}`);
      return func(value, ...Object.values(mathScope));
    }
  } catch (error) {
    console.error('Error evaluating expression:', error);
    return 0;
  }
};

// Generate points for 2D explicit functions
const generate2DPoints = (spec: MathematicalGraphSpec): THREE.Vector3[] => {
  const { domain, expressions, resolution = 500 } = spec.plot; // Increased resolution for smoother curves
  const points: THREE.Vector3[] = [];
  
  if (!domain.x || !expressions.yOfX) return points;
  
  const [xMin, xMax] = domain.x;
  const step = (xMax - xMin) / resolution;
  
  for (let i = 0; i <= resolution; i++) {
    const x = xMin + i * step;
    try {
      const y = evaluateExpression(expressions.yOfX, 'x', x);
      if (isFinite(y)) {
        points.push(new THREE.Vector3(x, y, 0));
      }
    } catch (error) {
      console.warn(`Error evaluating at x=${x}:`, error);
    }
  }
  
  return points;
};

// Generate area geometry for integrals
const generateIntegralArea = (spec: MathematicalGraphSpec): THREE.Vector3[] => {
  if (!spec.plot.integral) return [];
  
  const { integral, domain, resolution = 200 } = spec.plot;
  const areaPoints: THREE.Vector3[] = [];
  
  if (!domain.x) return areaPoints;
  
  const [xMin, xMax] = domain.x;
  const step = (xMax - xMin) / resolution;
  
  // Generate points along the x-axis from lower bound to upper bound
  for (let i = 0; i <= resolution; i++) {
    const x = xMin + i * step;
    
    // Only include points within the integral bounds
    const lowerBound = typeof integral.lowerBound === 'string' 
      ? evaluateExpression(integral.lowerBound, integral.variable, x)
      : integral.lowerBound;
    const upperBound = typeof integral.upperBound === 'string'
      ? evaluateExpression(integral.upperBound, integral.variable, x)
      : integral.upperBound;
    
    if (x >= lowerBound && x <= upperBound) {
      try {
        const y1 = evaluateExpression(integral.function, integral.variable, x);
        
        if (integral.betweenFunctions && integral.function2) {
          // Between two functions - area between curves
          const y2 = evaluateExpression(integral.function2, integral.variable, x);
          if (isFinite(y1) && isFinite(y2)) {
            // Add points for both curves
            areaPoints.push(new THREE.Vector3(x, y1, 0));
            areaPoints.push(new THREE.Vector3(x, y2, 0));
          }
        } else {
          // Single function - area under curve
          if (isFinite(y1)) {
            // Add point on the curve
            areaPoints.push(new THREE.Vector3(x, y1, 0));
            // Add point on the x-axis (y=0) to create the area
            areaPoints.push(new THREE.Vector3(x, 0, 0));
          }
        }
      } catch (error) {
        console.warn(`Error evaluating integral function at x=${x}:`, error);
      }
    }
  }
  
  return areaPoints;
};

// Generate volume geometry for 3D integrals
const generate3DVolume = (spec: MathematicalGraphSpec): THREE.Vector3[] => {
  if (!spec.plot.integral) return [];
  
  const { integral, domain, resolution = 50 } = spec.plot;
  const volumePoints: THREE.Vector3[] = [];
  
  if (!domain.x || !domain.y) return volumePoints;
  
  const [xMin, xMax] = domain.x;
  const [yMin, yMax] = domain.y;
  const xStep = (xMax - xMin) / resolution;
  const yStep = (yMax - yMin) / resolution;
  
  // Generate points for the volume between two surfaces
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = xMin + i * xStep;
      const y = yMin + j * yStep;
      
      // Only include points within the integral bounds
      const lowerBound = typeof integral.lowerBound === 'string' 
        ? evaluateExpression(integral.lowerBound, 'x', x)
        : integral.lowerBound;
      const upperBound = typeof integral.upperBound === 'string'
        ? evaluateExpression(integral.upperBound, 'x', x)
        : integral.upperBound;
      
      if (x >= lowerBound && x <= upperBound) {
        try {
          const z1 = evaluateExpression(integral.function, 'x', x, 'y', y);
          
          if (integral.betweenFunctions && integral.function2) {
            // Between two surfaces - volume between surfaces
            const z2 = evaluateExpression(integral.function2, 'x', x, 'y', y);
            if (isFinite(z1) && isFinite(z2)) {
              // Add points for both surfaces
              volumePoints.push(new THREE.Vector3(x, y, z1));
              volumePoints.push(new THREE.Vector3(x, y, z2));
            }
          } else {
            // Single surface - volume under surface
            if (isFinite(z1)) {
              // Add point on the surface
              volumePoints.push(new THREE.Vector3(x, y, z1));
              // Add point on the xy-plane (z=0) to create the volume
              volumePoints.push(new THREE.Vector3(x, y, 0));
            }
          }
        } catch (error) {
          console.warn(`Error evaluating 3D integral function at (${x}, ${y}):`, error);
        }
      }
    }
  }
  
  return volumePoints;
};

// Generate points for parametric functions
const generateParametricPoints = (spec: MathematicalGraphSpec): THREE.Vector3[] => {
  const { domain, expressions, resolution = 500 } = spec.plot; // Increased resolution for smoother curves
  const points: THREE.Vector3[] = [];
  
  if (!domain.t || !expressions.xOfT || !expressions.yOfT) return points;
  
  const [tMin, tMax] = domain.t;
  const step = (tMax - tMin) / resolution;
  
  for (let i = 0; i <= resolution; i++) {
    const t = tMin + i * step;
    try {
      const x = evaluateExpression(expressions.xOfT, 't', t);
      const y = evaluateExpression(expressions.yOfT, 't', t);
      if (isFinite(x) && isFinite(y)) {
        points.push(new THREE.Vector3(x, y, 0));
      }
    } catch (error) {
      console.warn(`Error evaluating at t=${t}:`, error);
    }
  }
  
  return points;
};

// Generate points for polar functions
const generatePolarPoints = (spec: MathematicalGraphSpec): THREE.Vector3[] => {
  const { domain, expressions, resolution = 500 } = spec.plot; // Increased resolution for smoother curves
  const points: THREE.Vector3[] = [];
  
  if (!domain.x || !expressions.rOfTheta) return points;
  
  const [thetaMin, thetaMax] = domain.x;
  const step = (thetaMax - thetaMin) / resolution;
  
  for (let i = 0; i <= resolution; i++) {
    const theta = thetaMin + i * step;
    try {
      const r = evaluateExpression(expressions.rOfTheta, 'theta', theta);
      if (isFinite(r) && r >= 0) {
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, 0));
      }
    } catch (error) {
      console.warn(`Error evaluating at theta=${theta}:`, error);
    }
  }
  
  return points;
};

// Generate surface points for 3D functions
const generate3DSurface = (spec: MathematicalGraphSpec): THREE.Vector3[] => {
  const { domain, expressions, resolution = 100 } = spec.plot; // Increased resolution for smoother surfaces
  const points: THREE.Vector3[] = [];
  
  if (!domain.x || !domain.y || !expressions.surfaceZ) return points;
  
  const [xMin, xMax] = domain.x;
  const [yMin, yMax] = domain.y;
  const xStep = (xMax - xMin) / resolution;
  const yStep = (yMax - yMin) / resolution;
  
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = xMin + i * xStep;
      const y = yMin + j * yStep;
      try {
        const z = evaluateExpression(expressions.surfaceZ, 'x', x, 'y', y);
        if (isFinite(z)) {
          points.push(new THREE.Vector3(x, y, z));
        }
      } catch (error) {
        console.warn(`Error evaluating at (${x}, ${y}):`, error);
      }
    }
  }
  
  return points;
};

// Generate cylindrical coordinate surface points
const generateCylindricalSurface = (spec: MathematicalGraphSpec): THREE.Vector3[] => {
  const { domain, expressions, resolution = 100 } = spec.plot;
  const points: THREE.Vector3[] = [];
  
  if (!domain.r || !domain.theta || !expressions.cylindricalZ) return points;
  
  const [rMin, rMax] = domain.r;
  const [thetaMin, thetaMax] = domain.theta;
  const rStep = (rMax - rMin) / resolution;
  const thetaStep = (thetaMax - thetaMin) / resolution;
  
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const r = rMin + i * rStep;
      const theta = thetaMin + j * thetaStep;
      try {
        const z = evaluateExpression(expressions.cylindricalZ, 'r', r, 'theta', theta);
        if (isFinite(z)) {
          // Convert cylindrical to Cartesian coordinates
          const x = r * Math.cos(theta);
          const y = r * Math.sin(theta);
          points.push(new THREE.Vector3(x, y, z));
        }
      } catch (error) {
        console.warn(`Error evaluating at (r=${r}, theta=${theta}):`, error);
      }
    }
  }
  
  return points;
};

// Generate cylindrical integral volume
const generateCylindricalIntegral = (spec: MathematicalGraphSpec): THREE.Vector3[] => {
  const { domain, integral, resolution = 50 } = spec.plot;
  const points: THREE.Vector3[] = [];
  
  if (!domain.r || !domain.theta || !domain.z || !integral) return points;
  
  const [rMin, rMax] = domain.r;
  const [thetaMin, thetaMax] = domain.theta;
  const [zMin, zMax] = domain.z;
  const rStep = (rMax - rMin) / resolution;
  const thetaStep = (thetaMax - thetaMin) / resolution;
  const zStep = (zMax - zMin) / resolution;
  
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      for (let k = 0; k <= resolution; k++) {
        const r = rMin + i * rStep;
        const theta = thetaMin + j * thetaStep;
        const z = zMin + k * zStep;
        
        try {
          // Check if point is within integral bounds
          const lowerZ = typeof integral.lowerBound === 'string' 
            ? evaluateExpression(integral.lowerBound, 'r', r)
            : integral.lowerBound;
          const upperZ = typeof integral.upperBound === 'string'
            ? evaluateExpression(integral.upperBound, 'r', r)
            : integral.upperBound;
          
          if (z >= lowerZ && z <= upperZ) {
            // Convert cylindrical to Cartesian coordinates
            const x = r * Math.cos(theta);
            const y = r * Math.sin(theta);
            points.push(new THREE.Vector3(x, y, z));
          }
        } catch (error) {
          console.warn(`Error evaluating integral bounds at (r=${r}, theta=${theta}, z=${z}):`, error);
        }
      }
    }
  }
  
  return points;
};

// Generate triangulated mesh for 3D surfaces
const generate3DSurfaceMesh = (spec: MathematicalGraphSpec): { vertices: number[], normals: number[], indices: number[] } => {
  const { domain, expressions, resolution = 100 } = spec.plot;
  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  
  if (!domain.x || !domain.y || !expressions.surfaceZ) return { vertices, normals, indices };
  
  const [xMin, xMax] = domain.x;
  const [yMin, yMax] = domain.y;
  const xStep = (xMax - xMin) / resolution;
  const yStep = (yMax - yMin) / resolution;
  
  // Create a grid of points
  const grid: THREE.Vector3[][] = [];
  for (let i = 0; i <= resolution; i++) {
    grid[i] = [];
    for (let j = 0; j <= resolution; j++) {
      const x = xMin + i * xStep;
      const y = yMin + j * yStep;
      try {
        const z = evaluateExpression(expressions.surfaceZ, 'x', x, 'y', y);
        if (isFinite(z)) {
          grid[i][j] = new THREE.Vector3(x, y, z);
        } else {
          grid[i][j] = new THREE.Vector3(x, y, 0);
        }
      } catch (error) {
        grid[i][j] = new THREE.Vector3(x, y, 0);
      }
    }
  }
  
  // Create vertices and indices for triangulation
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const p1 = grid[i][j];
      const p2 = grid[i + 1][j];
      const p3 = grid[i][j + 1];
      const p4 = grid[i + 1][j + 1];
      
      if (p1 && p2 && p3 && p4) {
        // Add vertices
        const v1Index = vertices.length / 3;
        vertices.push(p1.x, p1.y, p1.z);
        vertices.push(p2.x, p2.y, p2.z);
        vertices.push(p3.x, p3.y, p3.z);
        vertices.push(p4.x, p4.y, p4.z);
        
        // Add indices for two triangles
        indices.push(v1Index, v1Index + 1, v1Index + 2);
        indices.push(v1Index + 1, v1Index + 3, v1Index + 2);
        
        // Calculate normals for each vertex
        const normal1 = calculateNormal(p1, p2, p3);
        const normal2 = calculateNormal(p2, p4, p1);
        const normal3 = calculateNormal(p3, p1, p4);
        const normal4 = calculateNormal(p4, p3, p2);
        
        normals.push(normal1.x, normal1.y, normal1.z);
        normals.push(normal2.x, normal2.y, normal2.z);
        normals.push(normal3.x, normal3.y, normal3.z);
        normals.push(normal4.x, normal4.y, normal4.z);
      }
    }
  }
  
  return { vertices, normals, indices };
};

// Calculate surface normal for lighting
const calculateNormal = (p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): THREE.Vector3 => {
  const v1 = new THREE.Vector3().subVectors(p2, p1);
  const v2 = new THREE.Vector3().subVectors(p3, p1);
  const normal = new THREE.Vector3().crossVectors(v1, v2);
  return normal.normalize();
};

// Calculate optimal domain to extend graphs to full render area
const calculateOptimalDomain = (graphSpec: MathematicalGraphSpec): { x: [number, number], y: [number, number], t: [number, number] } => {
  const defaultXRange: [number, number] = [-10, 10];
  const defaultYRange: [number, number] = [-10, 10];
  const defaultTRange: [number, number] = [0, 2 * Math.PI];
  
  // If domain is already specified, use it but extend if it's too small
  const currentX = graphSpec.plot.domain.x || defaultXRange;
  const currentY = graphSpec.plot.domain.y || defaultYRange;
  const currentT = graphSpec.plot.domain.t || defaultTRange;
  
  // Extend the domain to be larger for better visualization
  const xRange = currentX[1] - currentX[0];
  const yRange = currentY[1] - currentY[0];
  const tRange = currentT[1] - currentT[0];
  
  // If the range is too small, extend it
  const minRange = 20; // Minimum range for good visualization
  
  const extendedX: [number, number] = xRange < minRange 
    ? [currentX[0] - (minRange - xRange) / 2, currentX[1] + (minRange - xRange) / 2]
    : currentX;
    
  const extendedY: [number, number] = yRange < minRange 
    ? [currentY[0] - (minRange - yRange) / 2, currentY[1] + (minRange - yRange) / 2]
    : currentY;
    
  const extendedT: [number, number] = tRange < 2 * Math.PI 
    ? [currentT[0], currentT[0] + 2 * Math.PI]
    : currentT;
  
  return {
    x: extendedX,
    y: extendedY,
    t: extendedT
  };
};

// Function component to render the graph
const GraphMesh: React.FC<{ graphSpec: GraphSpec }> = ({ graphSpec }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (!meshRef.current) return;
    
    try {
      // Clear existing children
      meshRef.current.clear();
      
      // Only handle mathematical graphs in ThreeJS
      if (graphSpec.graphType !== 'mathematical') {
        console.warn('ThreeJSGraph only supports mathematical graphs');
        return;
      }
      
      const mathSpec = graphSpec as MathematicalGraphSpec;
      
      // Calculate optimal domain for full render area
      const optimalDomain = calculateOptimalDomain(mathSpec);
    
    // Create extended graph spec with optimal domain
    const extendedGraphSpec = {
      ...mathSpec,
      plot: {
        ...mathSpec.plot,
        domain: {
          ...mathSpec.plot.domain,
          ...optimalDomain
        }
      }
    };
    
    let points: THREE.Vector3[] = [];
    
    // Generate points based on graph type using extended domain
    switch (mathSpec.plot.kind) {
      case '2d_explicit':
        points = generate2DPoints(extendedGraphSpec);
        break;
      case '2d_parametric':
        points = generateParametricPoints(extendedGraphSpec);
        break;
      case '2d_polar':
        points = generatePolarPoints(extendedGraphSpec);
        break;
      case '2d_integral':
        points = generate2DPoints(extendedGraphSpec);
        break;
      case '3d_surface':
        points = generate3DSurface(extendedGraphSpec);
        break;
      case '3d_integral':
        points = generate3DSurface(extendedGraphSpec);
        break;
      case 'cylindrical_integral':
        points = generateCylindricalIntegral(extendedGraphSpec);
        break;
      case 'spherical_integral':
        // TODO: Implement spherical coordinates
        console.warn('Spherical integrals not yet implemented');
        return;
      default:
        console.warn('Unsupported graph type:', mathSpec.plot.kind);
        return;
    }
    
    if (points.length === 0) return;
    
    // Create geometry and material
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
      color: mathSpec.style?.color || '#3b82f6',
      linewidth: mathSpec.style?.lineWidth || 3
    });
    
    // For 3D surfaces, create a proper mesh with lighting
    if (mathSpec.plot.kind === '3d_surface' || mathSpec.plot.kind === '3d_integral') {
      // Generate triangulated mesh with normals using extended domain
      const meshData = generate3DSurfaceMesh(extendedGraphSpec);
      
      if (meshData.vertices.length > 0) {
        const surfaceGeometry = new THREE.BufferGeometry();
        surfaceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.vertices, 3));
        surfaceGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(meshData.normals, 3));
        surfaceGeometry.setIndex(meshData.indices);
        
        // Create material with proper lighting
        const surfaceMaterial = new THREE.MeshLambertMaterial({
          color: mathSpec.style?.color || '#3b82f6',
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        });
        
        const surfaceMesh = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
        meshRef.current.add(surfaceMesh);
      }
      
      // For 3D integrals, add volume shading
      if (mathSpec.plot.kind === '3d_integral' && mathSpec.plot.integral?.showArea) {
        const volumePoints = generate3DVolume(extendedGraphSpec);
        if (volumePoints.length > 0) {
          // Create volume geometry using triangles
          const volumeGeometry = new THREE.BufferGeometry();
          const vertices: number[] = [];
          
          if (mathSpec.plot.integral.betweenFunctions) {
            // Between two surfaces - create triangles between the surfaces
            for (let i = 0; i < volumePoints.length - 3; i += 2) {
              const p1 = volumePoints[i];     // First surface point
              const p2 = volumePoints[i + 1]; // Second surface point
              const p3 = volumePoints[i + 2]; // Next first surface point
              const p4 = volumePoints[i + 3]; // Next second surface point
              
              if (p1 && p2 && p3 && p4) {
                // Create two triangles for each segment between surfaces
                vertices.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
                vertices.push(p2.x, p2.y, p2.z, p3.x, p3.y, p3.z, p4.x, p4.y, p4.z);
              }
            }
          } else {
            // Single surface - volume under surface
            for (let i = 0; i < volumePoints.length - 2; i += 2) {
              const p1 = volumePoints[i];
              const p2 = volumePoints[i + 1];
              const p3 = volumePoints[i + 2];
              const p4 = volumePoints[i + 3];
              
              if (p1 && p2 && p3 && p4) {
                // Create two triangles for each segment
                vertices.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
                vertices.push(p2.x, p2.y, p2.z, p3.x, p3.y, p3.z, p4.x, p4.y, p4.z);
              }
            }
          }
          
          volumeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
          
          const volumeMaterial = new THREE.MeshBasicMaterial({
            color: mathSpec.plot.integral.areaColor || '#8b5cf6',
            transparent: true,
            opacity: mathSpec.plot.integral.areaOpacity || 0.4,
            side: THREE.DoubleSide
          });
          
          const volumeMesh = new THREE.Mesh(volumeGeometry, volumeMaterial);
          meshRef.current.add(volumeMesh);
        }
      }
    } else {
      // Create line for 2D functions
      const line = new THREE.Line(geometry, material);
      meshRef.current.add(line);
      
      // For integrals, add area shading
      if (mathSpec.plot.kind === '2d_integral' && mathSpec.plot.integral?.showArea) {
        const areaPoints = generateIntegralArea(extendedGraphSpec);
        if (areaPoints.length > 0) {
          // Create area geometry using triangles
          const areaGeometry = new THREE.BufferGeometry();
          const vertices: number[] = [];
          
          if (mathSpec.plot.integral.betweenFunctions) {
            // Between two functions - create triangles between the curves
            for (let i = 0; i < areaPoints.length - 3; i += 2) {
              const p1 = areaPoints[i];     // First curve point
              const p2 = areaPoints[i + 1]; // Second curve point
              const p3 = areaPoints[i + 2]; // Next first curve point
              const p4 = areaPoints[i + 3]; // Next second curve point
              
              if (p1 && p2 && p3 && p4) {
                // Create two triangles for each segment between curves
                vertices.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
                vertices.push(p2.x, p2.y, p2.z, p3.x, p3.y, p3.z, p4.x, p4.y, p4.z);
              }
            }
          } else {
            // Single function - area under curve
            for (let i = 0; i < areaPoints.length - 2; i += 2) {
              const p1 = areaPoints[i];
              const p2 = areaPoints[i + 1];
              const p3 = areaPoints[i + 2];
              const p4 = areaPoints[i + 3];
              
              if (p1 && p2 && p3 && p4) {
                // Create two triangles for each segment
                vertices.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
                vertices.push(p2.x, p2.y, p2.z, p3.x, p3.y, p3.z, p4.x, p4.y, p4.z);
              }
            }
          }
          
          areaGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
          
          const areaMaterial = new THREE.MeshBasicMaterial({
            color: mathSpec.plot.integral.areaColor || '#3b82f6',
            transparent: true,
            opacity: mathSpec.plot.integral.areaOpacity || 0.3,
            side: THREE.DoubleSide
          });
          
          const areaMesh = new THREE.Mesh(areaGeometry, areaMaterial);
          meshRef.current.add(areaMesh);
        }
      }
    }
    } catch (error) {
      console.error('Error generating graph mesh:', error);
      // Clear the mesh on error to prevent rendering issues
      if (meshRef.current) {
        meshRef.current.clear();
      }
    }
  }, [graphSpec]);
  
  return <group ref={meshRef} />;
};

const ThreeJSGraph: React.FC<ThreeJSGraphProps> = ({ 
  graphSpec, 
  width = 400, 
  height = 300 
}) => {
  // Validate GraphSpec before rendering
  if (!validateGraphSpec(graphSpec)) {
    return (
      <div style={{ width, height }} className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="text-center p-4">
            <div className="text-red-500 text-lg font-semibold mb-2">Invalid Graph Data</div>
            <div className="text-gray-600 text-sm">
              The graph specification contains invalid data. Please check the console for details.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width, height }} className="border border-gray-300 rounded-lg overflow-hidden">
      <ThreeJSErrorBoundary>
        <Canvas 
          camera={{ position: [0, 0, 15], fov: 50 }}
          gl={{ 
            antialias: true, 
            alpha: true, 
            powerPreference: "high-performance"
          }}
        >
        {/* Enhanced lighting system for better depth perception */}
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={0.8}
          castShadow={true}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight 
          position={[-10, -10, -5]} 
          intensity={0.4}
          color="#4a90e2"
        />
        <pointLight 
          position={[0, 10, 0]} 
          intensity={0.6}
          color="#ffffff"
          distance={20}
        />
        <spotLight
          position={[5, 5, 5]}
          angle={0.3}
          penumbra={0.5}
          intensity={0.5}
          castShadow={true}
        />
        
        <GraphMesh graphSpec={graphSpec} />
        
        {graphSpec.graphType === 'mathematical' && (
          <>
            {/* Z-X plane (default horizontal grid) - Extended size */}
            <Grid 
              position={[0, 0, 0]} 
              args={[50, 50]} 
              cellSize={1} 
              cellThickness={0.3} 
              cellColor="#888888" 
              sectionSize={5} 
              sectionThickness={0.8} 
              sectionColor="#444444" 
              fadeDistance={50} 
              fadeStrength={1} 
              followCamera={false} 
              infiniteGrid={true} 
            />
            
            {/* Z-Y plane (vertical grid) - Extended size */}
            <Grid 
              position={[0, 0, 0]} 
              rotation={[0, 0, Math.PI / 2]}
              args={[50, 50]} 
              cellSize={1} 
              cellThickness={0.3} 
              cellColor="#666666" 
              sectionSize={5} 
              sectionThickness={0.8} 
              sectionColor="#333333" 
              fadeDistance={50} 
              fadeStrength={1} 
              followCamera={false} 
              infiniteGrid={true} 
            />
            
            {/* Y-X plane (vertical grid rotated 90 degrees) - Extended size */}
            <Grid 
              position={[0, 0, 0]} 
              rotation={[Math.PI / 2, 0, 0]}
              args={[50, 50]} 
              cellSize={1} 
              cellThickness={0.3} 
              cellColor="#666666" 
              sectionSize={5} 
              sectionThickness={0.8} 
              sectionColor="#333333" 
              fadeDistance={50} 
              fadeStrength={1} 
              followCamera={false} 
              infiniteGrid={true} 
            />
          </>
        )}
        
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
        />
        </Canvas>
      </ThreeJSErrorBoundary>
    </div>
  );
};

export default ThreeJSGraph;
