import React, { useRef, useEffect } from 'react';
import type { StatisticalGraphSpec } from '@/types';

interface StatisticalGraphProps {
  graphSpec: StatisticalGraphSpec;
  width?: number;
  height?: number;
}

const StatisticalGraph: React.FC<StatisticalGraphProps> = ({ 
  graphSpec, 
  width = 400, 
  height = 300 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { statistics } = graphSpec;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up canvas styling
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw statistical visualization based on type
    switch (statistics.kind) {
      case 'distribution':
        drawDistribution(ctx, statistics, width, height);
        break;
      case 'correlation':
        drawCorrelation(ctx, statistics, width, height);
        break;
      case 'regression':
        drawRegression(ctx, statistics, width, height);
        break;
      case 'anova':
        drawANOVA(ctx, statistics, width, height);
        break;
      default:
        console.warn('Unsupported statistical type:', statistics.kind);
    }
  }, [graphSpec, width, height]);

  const drawDistribution = (ctx: CanvasRenderingContext2D, stats: any, width: number, height: number) => {
    const data = stats.data as number[];
    const { mean, stdDev } = stats.parameters || {};
    const { showHistogram = true, showCurve = true, bins = 10 } = stats.visualization || {};
    
    const margin = 40;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.stroke();
    
    if (showHistogram) {
      // Create histogram
      const minValue = Math.min(...data);
      const maxValue = Math.max(...data);
      const binWidth = (maxValue - minValue) / bins;
      const histogram = new Array(bins).fill(0);
      
      data.forEach(value => {
        const binIndex = Math.min(Math.floor((value - minValue) / binWidth), bins - 1);
        histogram[binIndex]++;
      });
      
      const maxCount = Math.max(...histogram);
      
      // Draw histogram bars
      histogram.forEach((count, index) => {
        const barHeight = (count / maxCount) * chartHeight;
        const barWidth = chartWidth / bins;
        const x = margin + index * barWidth;
        const y = height - margin - barHeight;
        
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
      });
    }
    
    if (showCurve && mean !== undefined && stdDev !== undefined) {
      // Draw normal distribution curve
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      const minX = Math.min(...data);
      const maxX = Math.max(...data);
      const step = (maxX - minX) / 100;
      
      for (let x = minX; x <= maxX; x += step) {
        const y = normalDistribution(x, mean, stdDev);
        const canvasX = margin + ((x - minX) / (maxX - minX)) * chartWidth;
        const canvasY = height - margin - (y * chartHeight * 0.8);
        
        if (x === minX) {
          ctx.moveTo(canvasX, canvasY);
        } else {
          ctx.lineTo(canvasX, canvasY);
        }
      }
      
      ctx.stroke();
    }
    
    // Draw mean line
    if (mean !== undefined) {
      const minX = Math.min(...data);
      const maxX = Math.max(...data);
      const meanX = margin + ((mean - minX) / (maxX - minX)) * chartWidth;
      
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(meanX, margin);
      ctx.lineTo(meanX, height - margin);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const drawCorrelation = (ctx: CanvasRenderingContext2D, stats: any, width: number, height: number) => {
    const data = stats.data as { x: number; y: number }[];
    const { correlation } = stats.parameters || {};
    
    const margin = 40;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    
    const xValues = data.map(p => p.x);
    const yValues = data.map(p => p.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.stroke();
    
    // Draw scatter points
    ctx.fillStyle = '#3b82f6';
    data.forEach(point => {
      const x = margin + ((point.x - xMin) / (xMax - xMin)) * chartWidth;
      const y = height - margin - ((point.y - yMin) / (yMax - yMin)) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw correlation coefficient
    if (correlation !== undefined) {
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Correlation: ${correlation.toFixed(3)}`, margin, margin - 10);
    }
  };

  const drawRegression = (ctx: CanvasRenderingContext2D, stats: any, width: number, height: number) => {
    const data = stats.data as { x: number; y: number }[];
    const { regression } = stats.parameters || {};
    
    const margin = 40;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    
    const xValues = data.map(p => p.x);
    const yValues = data.map(p => p.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.stroke();
    
    // Draw scatter points
    ctx.fillStyle = '#3b82f6';
    data.forEach(point => {
      const x = margin + ((point.x - xMin) / (xMax - xMin)) * chartWidth;
      const y = height - margin - ((point.y - yMin) / (yMax - yMin)) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw regression line
    if (regression) {
      const { slope, intercept } = regression;
      
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      const x1 = xMin;
      const y1 = slope * x1 + intercept;
      const x2 = xMax;
      const y2 = slope * x2 + intercept;
      
      const canvasX1 = margin + ((x1 - xMin) / (xMax - xMin)) * chartWidth;
      const canvasY1 = height - margin - ((y1 - yMin) / (yMax - yMin)) * chartHeight;
      const canvasX2 = margin + ((x2 - xMin) / (xMax - xMin)) * chartWidth;
      const canvasY2 = height - margin - ((y2 - yMin) / (yMax - yMin)) * chartHeight;
      
      ctx.moveTo(canvasX1, canvasY1);
      ctx.lineTo(canvasX2, canvasY2);
      ctx.stroke();
      
      // Draw equation
      ctx.fillStyle = '#333';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`, margin, margin - 10);
    }
  };

  const drawANOVA = (ctx: CanvasRenderingContext2D, stats: any, width: number, height: number) => {
    const data = stats.data as number[];
    
    const margin = 40;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    
    // Create box plot
    const sortedData = [...data].sort((a, b) => a - b);
    const q1 = sortedData[Math.floor(sortedData.length * 0.25)];
    const median = sortedData[Math.floor(sortedData.length * 0.5)];
    const q3 = sortedData[Math.floor(sortedData.length * 0.75)];
    const min = sortedData[0];
    const max = sortedData[sortedData.length - 1];
    
    const boxX = margin + chartWidth * 0.3;
    const boxWidth = chartWidth * 0.4;
    const boxHeight = chartHeight * 0.6;
    const boxY = margin + chartHeight * 0.2;
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.stroke();
    
    // Draw box plot
    const scale = boxHeight / (max - min);
    
    // Whiskers
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boxX + boxWidth / 2, boxY + (max - min) * scale);
    ctx.lineTo(boxX + boxWidth / 2, boxY + (q3 - min) * scale);
    ctx.moveTo(boxX + boxWidth / 2, boxY + (q1 - min) * scale);
    ctx.lineTo(boxX + boxWidth / 2, boxY + (min - min) * scale);
    ctx.stroke();
    
    // Box
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(boxX, boxY + (q1 - min) * scale, boxWidth, (q3 - q1) * scale);
    
    // Median line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + (median - min) * scale);
    ctx.lineTo(boxX + boxWidth, boxY + (median - min) * scale);
    ctx.stroke();
  };

  // Helper function for normal distribution
  const normalDistribution = (x: number, mean: number, stdDev: number): number => {
    const variance = stdDev * stdDev;
    return (1 / Math.sqrt(2 * Math.PI * variance)) * Math.exp(-Math.pow(x - mean, 2) / (2 * variance));
  };

  return (
    <div style={{ width, height }} className="border border-gray-300 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full"
      />
    </div>
  );
};

export default StatisticalGraph;
