import React from 'react';
import type { GraphSpec, MathematicalGraphSpec, ChartGraphSpec, StatisticalGraphSpec } from '@/types';
import ThreeJSGraph from './ThreeJSGraph';
import ChartGraph from './ChartGraph';
import StatisticalGraph from './StatisticalGraph';

interface GraphRouterProps {
  graphSpec: GraphSpec;
  width?: number;
  height?: number;
}

const GraphRouter: React.FC<GraphRouterProps> = ({ 
  graphSpec, 
  width = 400, 
  height = 300 
}) => {
  // Route to appropriate component based on graph type
  switch (graphSpec.graphType as string) {
    case 'mathematical':
      return (
        <ThreeJSGraph 
          graphSpec={graphSpec as MathematicalGraphSpec} 
          width={width} 
          height={height} 
        />
      );
    
    case 'chart':
      return (
        <ChartGraph 
          graphSpec={graphSpec as ChartGraphSpec} 
          width={width} 
          height={height} 
        />
      );
    
    case 'statistical':
      return (
        <StatisticalGraph 
          graphSpec={graphSpec as StatisticalGraphSpec} 
          width={width} 
          height={height} 
        />
      );
    
    default:
      return (
        <div 
          style={{ width, height }} 
          className="border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100"
        >
          <div className="text-center p-4">
            <div className="text-red-500 text-lg font-semibold mb-2">Unsupported Graph Type</div>
            <div className="text-gray-600 text-sm">
              Graph type "{graphSpec.graphType as string}" is not supported
            </div>
          </div>
        </div>
      );
  }
};

export default GraphRouter;
