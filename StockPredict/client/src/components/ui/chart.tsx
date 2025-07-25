import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
  data: any[];
  type: "line" | "bar";
  xKey: string;
  yKey?: string;
  yKeys?: string[];
  height?: number;
  title?: string;
  colors?: string[];
}

export function Chart({ 
  data, 
  type, 
  xKey, 
  yKey, 
  yKeys, 
  height = 300, 
  title,
  colors = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))"]
}: ChartProps) {
  const chartRef = useRef<any>(null);

  const labels = data.map(item => item[xKey]);
  
  let datasets;
  if (yKeys && yKeys.length > 1) {
    datasets = yKeys.map((key, index) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      data: data.map(item => item[key]),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + "20",
      tension: type === "line" ? 0.4 : 0,
      fill: false,
      pointRadius: 2,
      pointHoverRadius: 4,
      borderWidth: 2,
      spanGaps: true,
    }));
  } else {
    const dataKey = yKey || yKeys?.[0] || "value";
    datasets = [{
      label: title || dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
      data: data.map(item => item[dataKey]),
      borderColor: colors[0],
      backgroundColor: colors[0] + "20",
      tension: type === "line" ? 0.4 : 0,
      fill: type === "line",
      pointRadius: 2,
      pointHoverRadius: 4,
      borderWidth: 2,
    }];
  }

  const chartData: ChartData<typeof type> = {
    labels,
    datasets,
  };

  const options: ChartOptions<typeof type> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        display: yKeys && yKeys.length > 1,
        labels: {
          color: "rgb(107, 114, 128)",
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: !!title && (!yKeys || yKeys.length === 1),
        text: title,
        color: "rgb(107, 114, 128)",
        font: {
          size: 14,
          weight: "500",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: "rgb(107, 114, 128)",
          font: {
            size: 11,
          },
        },
      },
      y: {
        display: true,
        grid: {
          color: "rgba(107, 114, 128, 0.1)",
        },
        ticks: {
          color: "rgb(107, 114, 128)",
          font: {
            size: 11,
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  };

  const ChartComponent = type === "line" ? Line : Bar;

  return (
    <div style={{ height: `${height}px` }}>
      <ChartComponent ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
