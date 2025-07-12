"use client";

import { useEffect, useRef, useState } from "react";

interface MiniChartProps {
  symbol: string;
}

export default function MiniChart({ symbol }: MiniChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    setLoading(true);

    // Create a simple chart visualization
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create a simple line chart
    const width = canvas.width;
    const height = canvas.height;
    const padding = 20;

    // Generate some sample data points
    const points = [];
    for (let i = 0; i < 50; i++) {
      const x = padding + (i / 49) * (width - 2 * padding);
      const y = height - padding - Math.random() * (height - 2 * padding) * 0.8;
      points.push({ x, y });
    }

    // Draw chart background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * (height - 2 * padding);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw chart line
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Draw symbol text
    ctx.fillStyle = '#495057';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(symbol, width / 2, height - 5);

    setLoading(false);
  }, [symbol]);

  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center bg-gray-50 rounded border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
          <div className="text-xs text-gray-500">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-32 rounded border border-gray-200 bg-white p-2">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
} 