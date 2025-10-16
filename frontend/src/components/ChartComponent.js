import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS } from 'chart.js/auto';

const ChartComponent = ({ type, data, options }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (chartRef.current && data && data.labels && data.datasets) {
      // Destroy previous chart instance
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      // Create new chart
      const ctx = chartRef.current.getContext('2d');
      chartInstanceRef.current = new ChartJS(ctx, {
        type: type,
        data: data,
        options: options || {},
      });
    }

    // Cleanup on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [type, data, options]);

  return (
    <div style={{ position: 'relative', height: '280px', width: '100%' }}>
      <canvas ref={chartRef} />
    </div>
  );
};

export default ChartComponent;
