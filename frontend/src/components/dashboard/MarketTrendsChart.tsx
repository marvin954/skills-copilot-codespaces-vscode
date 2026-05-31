import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { MarketTrend } from '../../types';
import { formatCurrency } from '../../data/mockData';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface MarketTrendsChartProps {
  trends: MarketTrend[];
  city: string;
  state: string;
}

const MarketTrendsChart: React.FC<MarketTrendsChartProps> = ({ trends, city, state }) => {
  const labels = trends.map((t) =>
    t.propertyType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'Avg Assessed Value',
        data: trends.map((t) => t.avgPrice),
        backgroundColor: 'rgba(37, 99, 235, 0.8)',
        borderRadius: 6,
      },
      {
        label: 'Avg Sold Price',
        data: trends.map((t) => t.avgSoldPrice),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { usePointStyle: true, padding: 20 },
      },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value: string | number) => formatCurrency(Number(value)),
        },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Market Trends</h3>
        <p className="text-sm text-gray-500">
          Average prices by property type in {city}, {state}
        </p>
      </div>
      <div className="h-72">
        {trends.length > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No market data available
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketTrendsChart;
