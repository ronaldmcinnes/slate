import React, { useRef, useEffect } from 'react';
import type { ChartGraphSpec } from '@/types';

interface ChartGraphProps {
  graphSpec: ChartGraphSpec;
  width?: number;
  height?: number;
}

// Chart.js-like data structure for rendering
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[] | { x: number; y: number }[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    fill?: boolean;
    tension?: number;
  }[];
}

const ChartGraph: React.FC<ChartGraphProps> = ({ 
  graphSpec, 
  width = 400, 
  height = 300 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { chart } = graphSpec;

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

    // Draw chart based on type
    switch (chart.kind) {
      case 'bar':
        drawBarChart(ctx, chart.data as ChartData, width, height, chart.title);
        break;
      case 'line':
        drawLineChart(ctx, chart.data as ChartData, width, height, chart.title);
        break;
      case 'scatter':
        drawScatterPlot(ctx, chart.data as ChartData, width, height, chart.title);
        break;
      case 'pie':
        drawPieChart(ctx, chart.data as ChartData, width, height, chart.title);
        break;
      case 'area':
        drawAreaChart(ctx, chart.data as ChartData, width, height, chart.title);
        break;
      case 'histogram':
        drawHistogram(ctx, chart.data as ChartData, width, height, chart.title);
        break;
      default:
        console.warn('Unsupported chart type:', chart.kind);
    }
  }, [graphSpec, width, height]);

  const drawBarChart = (ctx: CanvasRenderingContext2D, data: ChartData, width: number, height: number, title?: string) => {
    const { labels, datasets } = data;
    const dataset = datasets[0];
    const values = dataset.data as number[];
    
    const margin = 60;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    const barWidth = chartWidth / values.length;
    const maxValue = Math.max(...values);
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title || 'Bar Chart', width / 2, 25);
    
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
      const value = (i / numTicks) * maxValue;
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
    
    // Draw bars
    values.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = margin + index * barWidth;
      const y = height - margin - barHeight;
      
      ctx.fillStyle = dataset.backgroundColor as string || '#3b82f6';
      ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
      
      // Draw value on top of bar
      ctx.fillStyle = '#333';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
      
      // Draw X-axis label
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index] || `Item ${index + 1}`, x + barWidth / 2, height - margin + 15);
    });
  };

  const drawLineChart = (ctx: CanvasRenderingContext2D, data: ChartData, width: number, height: number, title?: string) => {
    const { labels, datasets } = data;
    const dataset = datasets[0];
    const values = dataset.data as number[];
    
    const margin = 60;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const valueRange = maxValue - minValue;
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title || 'Line Chart', width / 2, 25);
    
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
      const value = minValue + (i / numTicks) * valueRange;
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
    
    // Draw X-axis labels
    values.forEach((value, index) => {
      const x = margin + (index / (values.length - 1)) * chartWidth;
      
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index] || `Point ${index + 1}`, x, height - margin + 15);
    });
    
    // Draw line
    ctx.strokeStyle = dataset.borderColor as string || '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    values.forEach((value, index) => {
      const x = margin + (index / (values.length - 1)) * chartWidth;
      const y = height - margin - ((value - minValue) / valueRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw points with values
    ctx.fillStyle = dataset.backgroundColor as string || '#3b82f6';
    values.forEach((value, index) => {
      const x = margin + (index / (values.length - 1)) * chartWidth;
      const y = height - margin - ((value - minValue) / valueRange) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw value label
      ctx.fillStyle = '#333';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(value.toString(), x, y - 12);
    });
  };

  const drawScatterPlot = (ctx: CanvasRenderingContext2D, data: ChartData, width: number, height: number, title?: string) => {
    const { datasets } = data;
    const dataset = datasets[0];
    const points = dataset.data as { x: number; y: number }[];
    
    const margin = 60;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    
    const xValues = points.map(p => p.x);
    const yValues = points.map(p => p.y);
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
    ctx.fillText(title || 'Scatter Plot', width / 2, 25);
    
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
    
    // Draw points with values
    ctx.fillStyle = dataset.backgroundColor as string || '#3b82f6';
    points.forEach((point, index) => {
      const x = margin + ((point.x - xMin) / xRange) * chartWidth;
      const y = height - margin - ((point.y - yMin) / yRange) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw value label (show every other point to avoid crowding)
      if (index % 2 === 0) {
        ctx.fillStyle = '#333';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`, x, y - 12);
        ctx.fillStyle = dataset.backgroundColor as string || '#3b82f6';
      }
    });
  };

  const drawPieChart = (ctx: CanvasRenderingContext2D, data: ChartData, width: number, height: number, title?: string) => {
    const { labels, datasets } = data;
    const dataset = datasets[0];
    const values = dataset.data as number[];
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title || 'Pie Chart', width / 2, 25);
    
    const centerX = width / 2;
    const centerY = height / 2 + 20; // Offset for title
    const radius = Math.min(width, height) / 2 - 60;
    
    const total = values.reduce((sum, value) => sum + value, 0);
    let currentAngle = 0;
    
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ];
    
    values.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      const percentage = ((value / total) * 100).toFixed(1);
      
      // Draw slice
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // Draw percentage in center of slice
      const textAngle = currentAngle + sliceAngle / 2;
      const textX = centerX + Math.cos(textAngle) * (radius * 0.7);
      const textY = centerY + Math.sin(textAngle) * (radius * 0.7);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${percentage}%`, textX, textY);
      
      // Draw label with value
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
      
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${labels[index] || `Item ${index + 1}`}: ${value}`, labelX, labelY);
      
      currentAngle += sliceAngle;
    });
  };

  const drawAreaChart = (ctx: CanvasRenderingContext2D, data: ChartData, width: number, height: number, title?: string) => {
    const { labels, datasets } = data;
    const dataset = datasets[0];
    const values = dataset.data as number[];
    
    const margin = 60;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const valueRange = maxValue - minValue;
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title || 'Area Chart', width / 2, 25);
    
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
      const value = minValue + (i / numTicks) * valueRange;
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
    
    // Draw X-axis labels
    values.forEach((value, index) => {
      const x = margin + (index / (values.length - 1)) * chartWidth;
      
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index] || `Point ${index + 1}`, x, height - margin + 15);
    });
    
    // Draw area
    ctx.fillStyle = dataset.backgroundColor as string || '#3b82f6';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    
    values.forEach((value, index) => {
      const x = margin + (index / (values.length - 1)) * chartWidth;
      const y = height - margin - ((value - minValue) / valueRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, height - margin);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.lineTo(width - margin, height - margin);
    ctx.closePath();
    ctx.fill();
    
    // Draw line
    ctx.globalAlpha = 1;
    ctx.strokeStyle = dataset.borderColor as string || '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    values.forEach((value, index) => {
      const x = margin + (index / (values.length - 1)) * chartWidth;
      const y = height - margin - ((value - minValue) / valueRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw points with values
    ctx.fillStyle = dataset.backgroundColor as string || '#3b82f6';
    values.forEach((value, index) => {
      const x = margin + (index / (values.length - 1)) * chartWidth;
      const y = height - margin - ((value - minValue) / valueRange) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw value label
      ctx.fillStyle = '#333';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(value.toString(), x, y - 12);
    });
  };

  const drawHistogram = (ctx: CanvasRenderingContext2D, data: ChartData, width: number, height: number, title?: string) => {
    const { datasets } = data;
    const dataset = datasets[0];
    const values = dataset.data as number[];
    
    const margin = 60;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title || 'Histogram', width / 2, 25);
    
    // Create bins
    const numBins = 10;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const binWidth = (maxValue - minValue) / numBins;
    const bins = new Array(numBins).fill(0);
    
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - minValue) / binWidth), numBins - 1);
      bins[binIndex]++;
    });
    
    const maxCount = Math.max(...bins);
    
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
    
    // Draw bars with values
    bins.forEach((count, index) => {
      const barHeight = (count / maxCount) * chartHeight;
      const barWidth = chartWidth / numBins;
      const x = margin + index * barWidth;
      const y = height - margin - barHeight;
      
      ctx.fillStyle = dataset.backgroundColor as string || '#3b82f6';
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
      
      // Draw count on top of bar
      if (count > 0) {
        ctx.fillStyle = '#333';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(count.toString(), x + barWidth / 2, y - 5);
      }
      
      // Draw bin range label
      const binStart = minValue + index * binWidth;
      const binEnd = minValue + (index + 1) * binWidth;
      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`, x + barWidth / 2, height - margin + 15);
    });
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

export default ChartGraph;
