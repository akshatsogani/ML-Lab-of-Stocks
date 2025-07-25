import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Brain, Play, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ModelTrainingProps {
  analysisId: string | null;
}

const availableModels = [
  {
    id: "arima",
    name: "ARIMA",
    description: "Statistical time series model",
    category: "Statistical",
    color: "blue"
  },
  {
    id: "prophet",
    name: "Prophet",
    description: "Facebook's trend-based forecasting",
    category: "Trend",
    color: "green"
  },
  {
    id: "lstm",
    name: "LSTM",
    description: "Deep learning neural network",
    category: "Deep Learning", 
    color: "purple"
  },
  {
    id: "xgboost",
    name: "XGBoost",
    description: "Gradient boosting ensemble",
    category: "ML",
    color: "orange"
  }
];

export default function ModelTraining({ analysisId }: ModelTrainingProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>(["arima", "prophet"]);
  const [forecastHorizon, setForecastHorizon] = useState("7");
  const [trainingWindow, setTrainingWindow] = useState("Last 6 Months");
  const [enableOptimization, setEnableOptimization] = useState(true);

  const { toast } = useToast();

  const { data: trainingStatus } = useQuery({
    queryKey: ["/api/models/status", analysisId],
    enabled: !!analysisId,
    refetchInterval: 2000, // Poll every 2 seconds when training
  });

  const { data: modelResults } = useQuery({
    queryKey: ["/api/models/results", analysisId],
    enabled: !!analysisId,
  });

  const startTrainingMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("POST", "/api/models/train", params);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Training started",
        description: `Started training ${selectedModels.length} models`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error starting training",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleModelToggle = (modelId: string, checked: boolean) => {
    if (checked) {
      setSelectedModels(prev => [...prev, modelId]);
    } else {
      setSelectedModels(prev => prev.filter(m => m !== modelId));
    }
  };

  const handleStartTraining = () => {
    if (!analysisId) {
      toast({
        title: "No analysis selected",
        description: "Please complete feature engineering first",
        variant: "destructive",
      });
      return;
    }

    if (selectedModels.length === 0) {
      toast({
        title: "No models selected",
        description: "Please select at least one model to train",
        variant: "destructive",
      });
      return;
    }

    startTrainingMutation.mutate({
      analysisId,
      selectedModels,
      forecastHorizon: parseInt(forecastHorizon),
      trainingWindow,
      enableOptimization
    });
  };

  const getModelCategoryColor = (category: string) => {
    const colors = {
      Statistical: "bg-blue-100 text-blue-800",
      Trend: "bg-green-100 text-green-800", 
      "Deep Learning": "bg-purple-100 text-purple-800",
      ML: "bg-orange-100 text-orange-800"
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  // Mock training jobs for demonstration
  const trainingJobs = [
    {
      id: "arima",
      name: "ARIMA Model",
      status: "training",
      progress: 75,
      duration: "2m 34s"
    },
    {
      id: "prophet", 
      name: "Prophet Model",
      status: "completed",
      progress: 100,
      duration: "1m 12s"
    }
  ];

  // Mock model results for demonstration
  const performanceResults = [
    {
      model: "Prophet",
      mae: 2.34,
      rmse: 3.12,
      mape: 1.8,
      sharpe: 2.45,
      status: "best"
    },
    {
      model: "ARIMA",
      mae: null,
      rmse: null,
      mape: null,
      sharpe: null,
      status: "training"
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Model Configuration */}
      <Card className="lg:col-span-1 bg-card dark:bg-dark-card border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="text-primary mr-2 w-5 h-5" />
            Model Training
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Model Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Models</Label>
            <div className="space-y-2">
              {availableModels.map((model) => (
                <label
                  key={model.id}
                  className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedModels.includes(model.id)}
                    onCheckedChange={(checked) => handleModelToggle(model.id, checked as boolean)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{model.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{model.description}</div>
                  </div>
                  <div className="ml-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getModelCategoryColor(model.category)}`}>
                      {model.category}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Forecast Configuration */}
          <div>
            <Label htmlFor="forecastHorizon">Forecast Horizon</Label>
            <Select value={forecastHorizon} onValueChange={setForecastHorizon}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Day</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Training Parameters */}
          <div>
            <Label htmlFor="trainingWindow">Training Window</Label>
            <Select value={trainingWindow} onValueChange={setTrainingWindow}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Last 3 Months">Last 3 Months</SelectItem>
                <SelectItem value="Last 6 Months">Last 6 Months</SelectItem>
                <SelectItem value="Last 1 Year">Last 1 Year</SelectItem>
                <SelectItem value="All Available Data">All Available Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Optimization */}
          <div>
            <label className="flex items-center">
              <Checkbox
                checked={enableOptimization}
                onCheckedChange={(checked) => setEnableOptimization(checked as boolean)}
                className="mr-3"
              />
              <span className="text-sm text-gray-900 dark:text-white">Enable hyperparameter optimization</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Uses Optuna for automatic parameter tuning
            </p>
          </div>

          {/* Training Button */}
          <Button 
            onClick={handleStartTraining}
            disabled={startTrainingMutation.isPending || !analysisId}
            className="w-full"
          >
            <Play className="mr-2 w-4 h-4" />
            {startTrainingMutation.isPending ? "Starting..." : "Start Training"}
          </Button>
        </CardContent>
      </Card>

      {/* Training Progress & Results */}
      <div className="lg:col-span-2 space-y-6">
        {/* Training Status */}
        <Card className="bg-card dark:bg-dark-card border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="text-primary mr-2 w-5 h-5" />
              Training Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Active Training Jobs */}
            <div className="space-y-4">
              {trainingJobs.map((job) => (
                <div key={job.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        job.status === "training" ? "bg-primary animate-pulse" : "bg-success"
                      }`} />
                      <span className="font-medium text-gray-900 dark:text-white">{job.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        job.status === "training" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {job.status === "training" ? "Training" : "Completed"}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{job.duration}</span>
                  </div>
                  <Progress value={job.progress} className="mb-2" />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {job.status === "training" ? "Fitting parameters..." : "Training completed"}
                    </span>
                    <span>{job.progress}%</span>
                  </div>
                </div>
              ))}

              {trainingJobs.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No training jobs running</p>
                  <p className="text-sm">Start training to see progress here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Model Performance Comparison */}
        <Card className="bg-card dark:bg-dark-card border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="text-primary mr-2 w-5 h-5" />
              Model Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Performance Metrics Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Model</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">MAE</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">RMSE</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">MAPE</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Sharpe</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceResults.map((result) => (
                    <tr key={result.model} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            result.status === "best" ? "bg-success" : 
                            result.status === "training" ? "bg-primary animate-pulse" : "bg-gray-300"
                          }`} />
                          <span className="font-medium text-gray-900 dark:text-white">{result.model}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-success font-medium">
                        {result.mae || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-success font-medium">
                        {result.rmse || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-success font-medium">
                        {result.mape ? `${result.mape}%` : "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-success font-medium">
                        {result.sharpe || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          result.status === "best" ? "bg-success/20 text-success" :
                          result.status === "training" ? "bg-primary/20 text-primary" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {result.status === "best" ? "Best" : 
                           result.status === "training" ? "Training" : "Completed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {performanceResults.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No model results available</p>
                <p className="text-sm">Complete training to see performance metrics</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
