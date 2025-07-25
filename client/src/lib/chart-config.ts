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
} from "chart.js";

// Register Chart.js components
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

// Default chart colors that match our theme
export const chartColors = {
  primary: "hsl(207, 90%, 54%)",
  success: "hsl(142, 71%, 45%)",
  warning: "hsl(38, 92%, 50%)",
  error: "hsl(0, 84%, 60%)",
  gray: "hsl(220, 9%, 46%)",
  muted: "hsl(220, 13%, 91%)",
};

// Default chart options
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "rgb(107, 114, 128)",
        font: {
          size: 12,
        },
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
    mode: "index" as const,
  },
};

// Utility function to create gradient backgrounds
export function createGradient(ctx: CanvasRenderingContext2D, color: string) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, color + "40");
  gradient.addColorStop(1, color + "00");
  return gradient;
}
