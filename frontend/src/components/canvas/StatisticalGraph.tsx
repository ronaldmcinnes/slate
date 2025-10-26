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
    
    const margin = 60;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Distribution Analysis', width / 2, 25);
    
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
      
      // Draw Y-axis labels and grid lines
      const numTicks = 5;
      for (let i = 0; i <= numTicks; i++) {
        const count = (i / numTicks) * maxCount;
        const y = height - margin - (i / numTicks) * chartHeight;
        
        // Grid line
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(width - margin, y);
        ctx.stroke();
        
        // Y-axis label
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(count.toFixed(0), margin - 10, y + 4);
      }
      
      // Draw histogram bars with values
      histogram.forEach((count, index) => {
        const barHeight = (count / maxCount) * chartHeight;
        const barWidth = chartWidth / bins;
        const x = margin + index * barWidth;
        const y = height - margin - barHeight;
        
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
        
        // Draw count on top of bar
        if (count > 0) {
          ctx.fillStyle = '#333';
          ctx.font = 'bold 11px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(count.toString(), x + barWidth / 2, y - 5);
        }
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
    
    // Draw mean line with label
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
      
      // Draw mean label
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Mean: ${mean.toFixed(2)}`, meanX, margin - 10);
    }
    
    // Draw statistics info
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Sample Size: ${data.length}`, margin, margin - 10);
    if (stdDev !== undefined) {
      ctx.fillText(`Std Dev: ${stdDev.toFixed(2)}`, margin, margin + 10);
    }
  };

  const drawCorrelation = (ctx: CanvasRenderingContext2D, stats: any, width: number, height: number) => {
    const data = stats.data as { x: number; y: number }[];
    const { correlation } = stats.parameters || {};
    
    const margin = 60;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    
    const xValues = data.map(p => p.x);
    const yValues = data.map(p => p.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Correlation Analysis', width / 2, 25);
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.stroke();
    
    // Draw Y-axis labels and grid lines
    const numTicks = 5;
    for (let i = 0; i <= numTicks; i++) {
      const value = yMin + (i / numTicks) * yRange;
      const y = height - margin - (i / numTicks) * chartHeight;
      
      // Grid line
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(width - margin, y);
      ctx.stroke();
      
      // Y-axis label
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(1), margin - 10, y + 4);
    }
    
    // Draw X-axis labels and grid lines
    for (let i = 0; i <= numTicks; i++) {
      const value = xMin + (i / numTicks) * xRange;
      const x = margin + (i / numTicks) * chartWidth;
      
      // Grid line
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, margin);
      ctx.lineTo(x, height - margin);
      ctx.stroke();
      
      // X-axis label
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(value.toFixed(1), x, height - margin + 15);
    }
    
    // Draw scatter points with values
    ctx.fillStyle = '#3b82f6';
    data.forEach((point, index) => {
      const x = margin + ((point.x - xMin) / xRange) * chartWidth;
      const y = height - margin - ((point.y - yMin) / yRange) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw value label (show every other point to avoid crowding)
      if (index % 3 === 0) {
        ctx.fillStyle = '#333';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`, x, y - 12);
        ctx.fillStyle = '#3b82f6';
      }
    });
    
    // Draw correlation coefficient and strength
    if (correlation !== undefined) {
      const strength = Math.abs(correlation);
      let strengthText = '';
      if (strength >= 0.8) strengthText = 'Very Strong';
      else if (strength >= 0.6) strengthText = 'Strong';
      else if (strength >= 0.4) strengthText = 'Moderate';
      else if (strength >= 0.2) strengthText = 'Weak';
      else strengthText = 'Very Weak';
      
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Correlation: ${correlation.toFixed(3)}`, margin, margin - 10);
      ctx.fillText(`Strength: ${strengthText}`, margin, margin + 10);
      ctx.fillText(`Sample Size: ${data.length}`, margin, margin + 30);
    }
  };

  const drawRegression = (ctx: CanvasRenderingContext2D, stats: any, width: number, height: number) => {
    const data = stats.data as { x: number; y: number }[];
    const { regression } = stats.parameters || {};
    
    const margin = 60;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    
    const xValues = data.map(p => p.x);
    const yValues = data.map(p => p.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Regression Analysis', width / 2, 25);
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.stroke();
    
    // Draw Y-axis labels and grid lines
    const numTicks = 5;
    for (let i = 0; i <= numTicks; i++) {
      const value = yMin + (i / numTicks) * yRange;
      const y = height - margin - (i / numTicks) * chartHeight;
      
      // Grid line
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(width - margin, y);
      ctx.stroke();
      
      // Y-axis label
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(1), margin - 10, y + 4);
    }
    
    // Draw X-axis labels and grid lines
    for (let i = 0; i <= numTicks; i++) {
      const value = xMin + (i / numTicks) * xRange;
      const x = margin + (i / numTicks) * chartWidth;
      
      // Grid line
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, margin);
      ctx.lineTo(x, height - margin);
      ctx.stroke();
      
      // X-axis label
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(value.toFixed(1), x, height - margin + 15);
    }
    
    // Draw scatter points with values
    ctx.fillStyle = '#3b82f6';
    data.forEach((point, index) => {
      const x = margin + ((point.x - xMin) / xRange) * chartWidth;
      const y = height - margin - ((point.y - yMin) / yRange) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw value label (show every other point to avoid crowding)
      if (index % 3 === 0) {
        ctx.fillStyle = '#333';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`, x, y - 12);
        ctx.fillStyle = '#3b82f6';
      }
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
      
      const canvasX1 = margin + ((x1 - xMin) / xRange) * chartWidth;
      const canvasY1 = height - margin - ((y1 - yMin) / yRange) * chartHeight;
      const canvasX2 = margin + ((x2 - xMin) / xRange) * chartWidth;
      const canvasY2 = height - margin - ((y2 - yMin) / yRange) * chartHeight;
      
      ctx.moveTo(canvasX1, canvasY1);
      ctx.lineTo(canvasX2, canvasY2);
      ctx.stroke();
      
      // Draw equation and statistics
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`, margin, margin - 10);
      ctx.font = '12px Arial';
      ctx.fillText(`Sample Size: ${data.length}`, margin, margin + 10);
      ctx.fillText(`Slope: ${slope.toFixed(3)}`, margin, margin + 30);
      ctx.fillText(`Intercept: ${intercept.toFixed(3)}`, margin, margin + 50);
    }
  };

  const drawANOVA = (ctx: CanvasRenderingContext2D, stats: any, width: number, height: number) => {
    const data = stats.data as number[];
    
    const margin = 60;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ANOVA Box Plot', width / 2, 25);
    
    // Create box plot
    const sortedData = [...data].sort((a, b) => a - b);
    const q1 = sortedData[Math.floor(sortedData.length * 0.25)];
    const median = sortedData[Math.floor(sortedData.length * 0.5)];
    const q3 = sortedData[Math.floor(sortedData.length * 0.75)];
    const min = sortedData[0];
    const max = sortedData[sortedData.length - 1];
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    
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
    
    // Draw Y-axis labels and grid lines
    const numTicks = 5;
    for (let i = 0; i <= numTicks; i++) {
      const value = min + (i / numTicks) * (max - min);
      const y = height - margin - (i / numTicks) * chartHeight;
      
      // Grid line
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(width - margin, y);
      ctx.stroke();
      
      // Y-axis label
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(1), margin - 10, y + 4);
    }
    
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
    
    // Draw statistics
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Sample Size: ${data.length}`, margin, margin - 10);
    ctx.font = '12px Arial';
    ctx.fillText(`Min: ${min.toFixed(2)}`, margin, margin + 10);
    ctx.fillText(`Q1: ${q1.toFixed(2)}`, margin, margin + 30);
    ctx.fillText(`Median: ${median.toFixed(2)}`, margin, margin + 50);
    ctx.fillText(`Q3: ${q3.toFixed(2)}`, margin, margin + 70);
    ctx.fillText(`Max: ${max.toFixed(2)}`, margin, margin + 90);
    ctx.fillText(`Mean: ${mean.toFixed(2)}`, margin, margin + 110);
    
    // Draw value labels on the box plot
    ctx.fillStyle = '#333';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(min.toFixed(1), boxX + boxWidth / 2, boxY + (min - min) * scale + 15);
    ctx.fillText(q1.toFixed(1), boxX + boxWidth / 2, boxY + (q1 - min) * scale - 5);
    ctx.fillText(median.toFixed(1), boxX + boxWidth / 2, boxY + (median - min) * scale - 5);
    ctx.fillText(q3.toFixed(1), boxX + boxWidth / 2, boxY + (q3 - min) * scale - 5);
    ctx.fillText(max.toFixed(1), boxX + boxWidth / 2, boxY + (max - min) * scale + 15);
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
