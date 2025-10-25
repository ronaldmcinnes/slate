import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type { GraphSpec } from '@/types';

interface ThreeJSGraphProps {
  graphSpec: GraphSpec;
  width?: number;
  height?: number;
}

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
const generate2DPoints = (spec: GraphSpec): THREE.Vector3[] => {
  const { domain, expressions, resolution = 200 } = spec.plot;
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
const generateIntegralArea = (spec: GraphSpec): THREE.Vector3[] => {
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
    if (x >= integral.lowerBound && x <= integral.upperBound) {
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
const generate3DVolume = (spec: GraphSpec): THREE.Vector3[] => {
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
      if (x >= integral.lowerBound && x <= integral.upperBound) {
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
const generateParametricPoints = (spec: GraphSpec): THREE.Vector3[] => {
  const { domain, expressions, resolution = 200 } = spec.plot;
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
const generatePolarPoints = (spec: GraphSpec): THREE.Vector3[] => {
  const { domain, expressions, resolution = 200 } = spec.plot;
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
const generate3DSurface = (spec: GraphSpec): THREE.Vector3[] => {
  const { domain, expressions, resolution = 50 } = spec.plot;
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

// Function component to render the graph
const GraphMesh: React.FC<{ graphSpec: GraphSpec }> = ({ graphSpec }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (!meshRef.current) return;
    
    // Clear existing children
    meshRef.current.clear();
    
    let points: THREE.Vector3[] = [];
    
    // Generate points based on graph type
    switch (graphSpec.plot.kind) {
      case '2d_explicit':
        points = generate2DPoints(graphSpec);
        break;
      case '2d_parametric':
        points = generateParametricPoints(graphSpec);
        break;
      case '2d_polar':
        points = generatePolarPoints(graphSpec);
        break;
      case '2d_integral':
        points = generate2DPoints(graphSpec);
        break;
      case '3d_surface':
        points = generate3DSurface(graphSpec);
        break;
      case '3d_integral':
        points = generate3DSurface(graphSpec);
        break;
      default:
        console.warn('Unsupported graph type:', graphSpec.plot.kind);
        return;
    }
    
    if (points.length === 0) return;
    
    // Create geometry and material
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
      color: graphSpec.plot.style?.color || '#3b82f6',
      linewidth: graphSpec.plot.style?.lineWidth || 2
    });
    
    // For 3D surfaces, create a mesh instead of lines
    if (graphSpec.plot.kind === '3d_surface' || graphSpec.plot.kind === '3d_integral') {
      // Create a simple point cloud for now
      const pointMaterial = new THREE.PointsMaterial({ 
        color: graphSpec.plot.style?.color || '#3b82f6',
        size: 0.1
      });
      const pointCloud = new THREE.Points(geometry, pointMaterial);
      meshRef.current.add(pointCloud);
      
      // For 3D integrals, add volume shading
      if (graphSpec.plot.kind === '3d_integral' && graphSpec.plot.integral?.showArea) {
        const volumePoints = generate3DVolume(graphSpec);
        if (volumePoints.length > 0) {
          // Create volume geometry using triangles
          const volumeGeometry = new THREE.BufferGeometry();
          const vertices: number[] = [];
          
          if (graphSpec.plot.integral.betweenFunctions) {
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
            color: graphSpec.plot.integral.areaColor || '#8b5cf6',
            transparent: true,
            opacity: graphSpec.plot.integral.areaOpacity || 0.4,
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
      if (graphSpec.plot.kind === '2d_integral' && graphSpec.plot.integral?.showArea) {
        const areaPoints = generateIntegralArea(graphSpec);
        if (areaPoints.length > 0) {
          // Create area geometry using triangles
          const areaGeometry = new THREE.BufferGeometry();
          const vertices: number[] = [];
          
          if (graphSpec.plot.integral.betweenFunctions) {
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
            color: graphSpec.plot.integral.areaColor || '#3b82f6',
            transparent: true,
            opacity: graphSpec.plot.integral.areaOpacity || 0.3,
            side: THREE.DoubleSide
          });
          
          const areaMesh = new THREE.Mesh(areaGeometry, areaMaterial);
          meshRef.current.add(areaMesh);
        }
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
  return (
    <div style={{ width, height }} className="border border-gray-300 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <GraphMesh graphSpec={graphSpec} />
        
        {graphSpec.plot.style?.showGrid && (
          <>
            {/* Z-X plane (default horizontal grid) */}
            <Grid 
              position={[0, 0, 0]} 
              args={[10, 10]} 
              cellSize={1} 
              cellThickness={0.5} 
              cellColor="#888888" 
              sectionSize={1} 
              sectionThickness={1} 
              sectionColor="#444444" 
              fadeDistance={30} 
              fadeStrength={1} 
              followCamera={false} 
              infiniteGrid={true} 
            />
            
            {/* Z-Y plane (vertical grid) */}
            <Grid 
              position={[0, 0, 0]} 
              rotation={[0, 0, Math.PI / 2]}
              args={[10, 10]} 
              cellSize={1} 
              cellThickness={0.5} 
              cellColor="#666666" 
              sectionSize={1} 
              sectionThickness={1} 
              sectionColor="#333333" 
              fadeDistance={30} 
              fadeStrength={1} 
              followCamera={false} 
              infiniteGrid={true} 
            />
            
            {/* Y-X plane (vertical grid rotated 90 degrees) */}
            <Grid 
              position={[0, 0, 0]} 
              rotation={[Math.PI / 2, 0, 0]}
              args={[10, 10]} 
              cellSize={1} 
              cellThickness={0.5} 
              cellColor="#666666" 
              sectionSize={1} 
              sectionThickness={1} 
              sectionColor="#333333" 
              fadeDistance={30} 
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
          minDistance={1}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
};

export default ThreeJSGraph;
