import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Chart } from "@/components/ui/chart";

interface ForecastingVisualizationProps {
  analysisId: string | null;
}

export default function ForecastingVisualization({ analysisId }: ForecastingVisualizationProps) {
  const [chartType, setChartType] = useState("Line Chart");
  const [timeRange, setTimeRange] = useState("7D");
  const [forecastData, setForecastData] = useState<any>(null);

  const { toast } = useToast();

  const { data: forecastResults } = useQuery({
    queryKey: ["/api/forecast/results", analysisId],
    enabled: !!analysisId,
  });

  const generateForecastMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("POST", "/api/forecast/generate", params);
      return response.json();
    },
    onSuccess: (data) => {
      setForecastData(data);
      toast({
        title: "Forecast generated",
        description: "Successfully generated forecast predictions",
      });
    },
    onError: (error) => {
      toast({
        title: "Error generating forecast",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateForecast = () => {
    if (!analysisId) {
      toast({
        title: "No analysis selected",
        description: "Please complete model training first",
        variant: "destructive",
      });
      return;
    }

    generateForecastMutation.mutate({
      analysisId,
      modelNames: ["prophet", "arima"],
      horizon: parseInt(timeRange.replace("D", ""))
    });
  };

  // Mock chart data for demonstration
  const chartData = [
    { date: "Jan 1", historical: 180, prophet: null, arima: null },
    { date: "Jan 3", historical: 182, prophet: null, arima: null },
    { date: "Jan 5", historical: 185, prophet: null, arima: null },
    { date: "Jan 7", historical: 183, prophet: null, arima: null },
    { date: "Jan 9", historical: 186, prophet: null, arima: null },
    { date: "Jan 11", historical: 189, prophet: null, arima: null },
    { date: "Jan 13", historical: 187, prophet: null, arima: null },
    { date: "Jan 15", historical: 186, prophet: 188, arima: 187 },
    { date: "Jan 17", historical: null, prophet: 191, arima: 189 },
    { date: "Jan 19", historical: null, prophet: 194, arima: 192 },
    { date: "Jan 21", historical: null, prophet: 196, arima: 194 },
  ];

  // Mock summary data
  const forecastSummary = {
    currentPrice: 186.72,
    sevenDayTarget: 194.35,
    expectedReturn: 4.09,
    confidence: 87
  };

  // Mock risk metrics
  const riskMetrics = {
    volatility: 24.5,
    maxDrawdown: -8.2,
    var95: -12.45,
    beta: 1.23
  };

  const legendItems = [
    { label: "Historical Price", color: "#666", style: "solid" },
    { label: "Prophet Forecast", color: "hsl(var(--primary))", style: "dashed" },
    { label: "ARIMA Forecast", color: "hsl(var(--success))", style: "dashed" },
    { label: "Confidence Interval", color: "hsl(var(--primary))", style: "area", opacity: 0.3 }
  ];

  return (
    <Card className="bg-card dark:bg-dark-card border border-gray-200 dark:border-gray-700 mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <BarChart3 className="text-primary mr-2 w-5 h-5" />
            Price Forecast Visualization
          </CardTitle>
          <div className="flex items-center space-x-3">
            {/* Chart Type Selector */}
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Line Chart">Line Chart</SelectItem>
                <SelectItem value="Candlestick">Candlestick</SelectItem>
                <SelectItem value="Technical Analysis">Technical Analysis</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Time Range Selector */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {["7D", "30D", "90D"].map((range) => (
                <Button
                  key={range}
                  size="sm"
                  variant={timeRange === range ? "default" : "ghost"}
                  onClick={() => setTimeRange(range)}
                  className="px-3 py-1 text-sm"
                >
                  {range}
                </Button>
              ))}
            </div>

            {/* Generate Forecast Button */}
            <Button
              onClick={handleGenerateForecast}
              disabled={generateForecastMutation.isPending || !analysisId}
              size="sm"
            >
              <TrendingUp className="mr-2 w-4 h-4" />
              {generateForecastMutation.isPending ? "Generating..." : "Generate Forecast"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Main Forecast Chart */}
        <div className="mb-6">
          {chartData && (
            <Chart
              data={chartData}
              type="line"
              xKey="date"
              yKeys={["historical", "prophet", "arima"]}
              height={384}
              title="Stock Price Forecast"
              colors={["#666", "hsl(var(--primary))", "hsl(var(--success))"]}
            />
          )}
        </div>

        {/* Chart Legend and Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Legend */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Legend</h3>
            <div className="space-y-2">
              {legendItems.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-4 h-0.5 mr-3"
                    style={{ 
                      backgroundColor: item.color,
                      opacity: item.opacity || 1,
                      borderStyle: item.style === "dashed" ? "dashed" : "solid",
                      borderWidth: item.style === "dashed" ? "1px" : "0",
                      borderColor: item.color,
                      height: item.style === "area" ? "8px" : "2px"
                    }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Forecast Summary */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Forecast Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Price:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  ${forecastSummary.currentPrice}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">7-Day Target:</span>
                <span className="text-sm font-medium text-success">
                  ${forecastSummary.sevenDayTarget}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Expected Return:</span>
                <span className="text-sm font-medium text-success">
                  +{forecastSummary.expectedReturn}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Confidence:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {forecastSummary.confidence}%
                </span>
              </div>
            </div>
          </div>

          {/* Risk Metrics */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Risk Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Volatility:</span>
                <span className="text-sm font-medium text-warning">
                  {riskMetrics.volatility}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Max Drawdown:</span>
                <span className="text-sm font-medium text-error">
                  {riskMetrics.maxDrawdown}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">VaR (95%):</span>
                <span className="text-sm font-medium text-error">
                  ${riskMetrics.var95}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Beta:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {riskMetrics.beta}
                </span>
              </div>
            </div>
          </div>
        </div>

        {!chartData && (
          <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No forecast data available</p>
              <p className="text-sm">Complete model training and generate forecast to see visualization</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
