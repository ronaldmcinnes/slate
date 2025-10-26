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
        drawBarChart(ctx, chart.data as ChartData, width, height);
        break;
      case 'line':
        drawLineChart(ctx, chart.data as ChartData, width, height);
        break;
      case 'scatter':
        drawScatterPlot(ctx, chart.data as ChartData, width, height);
        break;
      case 'pie':
        drawPieChart(ctx, chart.data as ChartData, width, height);
        break;
      case 'area':
        drawAreaChart(ctx, chart.data as ChartData, width, height);
        break;
      case 'histogram':
        drawHistogram(ctx, chart.data as ChartData, width, height);
        break;
      default:
        console.warn('Unsupported chart type:', chart.kind);
    }
  }, [graphSpec, width, height]);

  const drawBarChart = (ctx: CanvasRenderingContext2D, data: ChartData, width: number, height: number) => {
    const { labels, datasets } = data;
    const dataset = datasets[0];
    const values = dataset.data as number[];
    
    const margin = 40;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    const barWidth = chartWidth / values.length;
    const maxValue = Math.max(...values);
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.stroke();
    
    // Draw bars
    values.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = margin + index * barWidth;
      const y = height - margin - barHeight;
      
      ctx.fillStyle = dataset.backgroundColor as string || '#3b82f6';
      ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
      
      // Draw label
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index] || `Item ${index + 1}`, x + barWidth / 2, height - margin + 15);
    });
  };

  const drawLineChart = (ctx: CanvasRenderingContext2D, data: ChartData, width: number, height: number) => {
    const { labels, datasets } = data;
    const dataset = datasets[0];
    const values = dataset.data as number[];
    
    const margin = 40;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const valueRange = maxValue - minValue;
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.stroke();
    
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
    
    // Draw points
    ctx.fillStyle = dataset.backgroundColor as string || '#3b82f6';
    values.forEach((value, index) => {
      const x = margin + (index / (values.length - 1)) * chartWidth;
      const y = height - margin - ((value - minValue) / valueRange) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const drawScatterPlot = (ctx: CanvasRenderingContext2D, data: ChartData, width: number, height: number) => {
    const { datasets } = data;
    const dataset = datasets[0];
    const points = dataset.data as { x: number; y: number }[];
    
    const margin = 40;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    
    const xValues = points.map(p => p.x);
    const yValues = points.map(p => p.y);
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
    
    // Draw points
    ctx.fillStyle = dataset.backgroundColor as string || '#3b82f6';
    points.forEach(point => {
      const x = margin + ((point.x - xMin) / (xMax - xMin)) * chartWidth;
      const y = height - margin - ((point.y - yMin) / (yMax - yMin)) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const drawPieChart = (ctx: CanvasRenderingContext2D, data: ChartData, width: number, height: number) => {
    const { labels, datasets } = data;
    const dataset = datasets[0];
    const values = dataset.data as number[];
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    
    const total = values.reduce((sum, value) => sum + value, 0);
    let currentAngle = 0;
    
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ];
    
    values.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      
      // Draw slice
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
      
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index] || `Item ${index + 1}`, labelX, labelY);
      
      currentAngle += sliceAngle;
    });
  };

  const drawAreaChart = (ctx: CanvasRenderingContext2D, data: ChartData, width: number, height: number) => {
    const { labels, datasets } = data;
    const dataset = datasets[0];
    const values = dataset.data as number[];
    
    const margin = 40;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const valueRange = maxValue - minValue;
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.stroke();
    
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
  };

  const drawHistogram = (ctx: CanvasRenderingContext2D, data: ChartData, width: number, height: number) => {
    const { datasets } = data;
    const dataset = datasets[0];
    const values = dataset.data as number[];
    
    const margin = 40;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    
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
    
    // Draw bars
    bins.forEach((count, index) => {
      const barHeight = (count / maxCount) * chartHeight;
      const barWidth = chartWidth / numBins;
      const x = margin + index * barWidth;
      const y = height - margin - barHeight;
      
      ctx.fillStyle = dataset.backgroundColor as string || '#3b82f6';
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
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
