import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { History, Play, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Chart } from "@/components/ui/chart";

interface BacktestingResultsProps {
  analysisId: string | null;
}

export default function BacktestingResults({ analysisId }: BacktestingResultsProps) {
  const [backtestPeriod, setBacktestPeriod] = useState("Last 6 Months");
  const [rollingWindow, setRollingWindow] = useState("2 Weeks");
  const [forecastHorizon, setForecastHorizon] = useState("7 Days");
  const [selectedMetrics, setSelectedMetrics] = useState({
    mae: true,
    rmse: true,
    mape: true,
    sharpe: true
  });

  const { toast } = useToast();

  const { data: backtestResults } = useQuery({
    queryKey: ["/api/backtest/results", analysisId],
    enabled: !!analysisId,
  });

  const runBacktestMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("POST", "/api/backtest/run", params);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Backtest completed",
        description: "Successfully completed backtesting analysis",
      });
    },
    onError: (error) => {
      toast({
        title: "Error running backtest",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMetricToggle = (metric: string, checked: boolean) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: checked
    }));
  };

  const handleRunBacktest = () => {
    if (!analysisId) {
      toast({
        title: "No analysis selected",
        description: "Please complete model training first",
        variant: "destructive",
      });
      return;
    }

    runBacktestMutation.mutate({
      analysisId,
      period: backtestPeriod,
      rollingWindow,
      forecastHorizon,
      metrics: Object.keys(selectedMetrics).filter(key => selectedMetrics[key as keyof typeof selectedMetrics])
    });
  };

  // Mock backtest performance data
  const performanceData = [
    { date: "Week 1", accuracy: 91 },
    { date: "Week 2", accuracy: 89 },
    { date: "Week 3", accuracy: 87 },
    { date: "Week 4", accuracy: 85 },
    { date: "Week 5", accuracy: 88 },
    { date: "Week 6", accuracy: 90 },
  ];

  // Mock detailed metrics
  const detailedMetrics = {
    mae: 2.34,
    rmse: 3.12,
    mape: 1.8,
    sharpe: 2.45
  };

  // Mock accuracy trend
  const accuracyTrend = [
    { period: "Last Week", accuracy: 91 },
    { period: "Last Month", accuracy: 87 },
    { period: "Last Quarter", accuracy: 83 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Backtesting Configuration */}
      <Card className="bg-card dark:bg-dark-card border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="text-primary mr-2 w-5 h-5" />
            Backtesting Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="backtestPeriod">Backtesting Period</Label>
            <Select value={backtestPeriod} onValueChange={setBacktestPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Last 3 Months">Last 3 Months</SelectItem>
                <SelectItem value="Last 6 Months">Last 6 Months</SelectItem>
                <SelectItem value="Last 1 Year">Last 1 Year</SelectItem>
                <SelectItem value="Last 2 Years">Last 2 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="rollingWindow">Rolling Window</Label>
            <Select value={rollingWindow} onValueChange={setRollingWindow}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1 Week">1 Week</SelectItem>
                <SelectItem value="2 Weeks">2 Weeks</SelectItem>
                <SelectItem value="1 Month">1 Month</SelectItem>
                <SelectItem value="2 Months">2 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="forecastHorizonBacktest">Forecast Horizon</Label>
            <Select value={forecastHorizon} onValueChange={setForecastHorizon}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1 Day">1 Day</SelectItem>
                <SelectItem value="7 Days">7 Days</SelectItem>
                <SelectItem value="30 Days">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Metrics to Calculate</Label>
            <div className="space-y-2">
              <label className="flex items-center">
                <Checkbox
                  checked={selectedMetrics.mae}
                  onCheckedChange={(checked) => handleMetricToggle("mae", checked as boolean)}
                  className="mr-3"
                />
                <span className="text-sm text-gray-900 dark:text-white">Mean Absolute Error (MAE)</span>
              </label>
              <label className="flex items-center">
                <Checkbox
                  checked={selectedMetrics.rmse}
                  onCheckedChange={(checked) => handleMetricToggle("rmse", checked as boolean)}
                  className="mr-3"
                />
                <span className="text-sm text-gray-900 dark:text-white">Root Mean Square Error (RMSE)</span>
              </label>
              <label className="flex items-center">
                <Checkbox
                  checked={selectedMetrics.mape}
                  onCheckedChange={(checked) => handleMetricToggle("mape", checked as boolean)}
                  className="mr-3"
                />
                <span className="text-sm text-gray-900 dark:text-white">Mean Absolute Percentage Error (MAPE)</span>
              </label>
              <label className="flex items-center">
                <Checkbox
                  checked={selectedMetrics.sharpe}
                  onCheckedChange={(checked) => handleMetricToggle("sharpe", checked as boolean)}
                  className="mr-3"
                />
                <span className="text-sm text-gray-900 dark:text-white">Sharpe Ratio</span>
              </label>
            </div>
          </div>

          <Button 
            onClick={handleRunBacktest}
            disabled={runBacktestMutation.isPending || !analysisId}
            className="w-full"
          >
            <Play className="mr-2 w-4 h-4" />
            {runBacktestMutation.isPending ? "Running..." : "Run Backtest"}
          </Button>
        </CardContent>
      </Card>

      {/* Backtesting Results */}
      <Card className="bg-card dark:bg-dark-card border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="text-primary mr-2 w-5 h-5" />
            Performance Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Performance Chart */}
          <div className="mb-6">
            {performanceData && (
              <Chart
                data={performanceData}
                type="line"
                xKey="date"
                yKey="accuracy"
                height={192}
                title="Backtest Performance Over Time"
              />
            )}
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {detailedMetrics.mae}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">MAE</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {detailedMetrics.rmse}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">RMSE</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-success">
                {detailedMetrics.mape}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">MAPE</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-success">
                {detailedMetrics.sharpe}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Sharpe</div>
            </div>
          </div>

          {/* Historical Accuracy */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Historical Accuracy Trend
            </h3>
            <div className="space-y-2">
              {accuracyTrend.map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{trend.period}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          trend.accuracy >= 90 ? "bg-success" :
                          trend.accuracy >= 85 ? "bg-warning" : "bg-error"
                        }`}
                        style={{ width: `${trend.accuracy}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white w-8">
                      {trend.accuracy}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!performanceData && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No backtest results available</p>
              <p className="text-sm">Run backtest to see performance analysis</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
