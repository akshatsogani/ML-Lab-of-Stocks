import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Sparkles, GitBranch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Chart } from "@/components/ui/chart";

interface FeatureEngineeringProps {
  analysisId: string | null;
}

const featurePresets = [
  {
    id: "basic",
    name: "Basic",
    description: "Close, Volume, SMA",
    features: ["close", "volume", "sma_20"],
    count: 3
  },
  {
    id: "technical",
    name: "Technical", 
    description: "Close, RSI, MACD, Bollinger",
    features: ["close", "rsi", "macd", "bollinger_upper", "bollinger_lower"],
    count: 7
  },
  {
    id: "macro",
    name: "Macro + Price",
    description: "Close, GDP, CPI, Interest Rates",
    features: ["close", "gdp", "cpi", "interest_rates"],
    count: 5
  },
  {
    id: "fundamental",
    name: "Fundamental Mix",
    description: "PE Ratio, Market Cap, Close",
    features: ["pe_ratio", "market_cap", "close"],
    count: 4
  },
  {
    id: "custom",
    name: "Custom Selection",
    description: "User-defined features",
    features: [],
    count: 0
  }
];

const availableFeatures = [
  { id: "close", name: "Close Price", description: "Daily closing price", category: "price" },
  { id: "volume", name: "Volume", description: "Trading volume", category: "price" },
  { id: "sma_20", name: "SMA (20)", description: "20-day Simple Moving Average", category: "technical" },
  { id: "rsi", name: "RSI", description: "Relative Strength Index", category: "technical" },
  { id: "macd", name: "MACD", description: "Moving Average Convergence Divergence", category: "technical" },
  { id: "bollinger_upper", name: "Bollinger Upper", description: "Bollinger Bands Upper", category: "technical" },
  { id: "bollinger_lower", name: "Bollinger Lower", description: "Bollinger Bands Lower", category: "technical" },
  { id: "pe_ratio", name: "PE Ratio", description: "Price to Earnings Ratio", category: "fundamental" },
  { id: "market_cap", name: "Market Cap", description: "Market Capitalization", category: "fundamental" },
  { id: "gdp", name: "GDP Growth", description: "Gross Domestic Product growth", category: "macro" },
  { id: "cpi", name: "CPI", description: "Consumer Price Index", category: "macro" },
  { id: "interest_rates", name: "Interest Rates", description: "Central bank interest rates", category: "macro" },
];

export default function FeatureEngineering({ analysisId }: FeatureEngineeringProps) {
  const [selectedPreset, setSelectedPreset] = useState("basic");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(["close", "volume", "sma_20"]);
  const [preprocessingOptions, setPreprocessingOptions] = useState({
    normalize: true,
    handleMissing: true,
    removeOutliers: false
  });

  const { toast } = useToast();

  const { data: featurePresetsList } = useQuery({
    queryKey: ["/api/features/presets"],
  });

  const generateFeaturesMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("POST", "/api/features/generate", params);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Features generated successfully",
        description: `Generated ${data.features?.length || 0} features`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error generating features",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = featurePresets.find(p => p.id === presetId);
    if (preset && preset.features.length > 0) {
      setSelectedFeatures(preset.features);
    }
  };

  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    if (checked) {
      setSelectedFeatures(prev => [...prev, featureId]);
    } else {
      setSelectedFeatures(prev => prev.filter(f => f !== featureId));
    }
    // Switch to custom preset if manually changing features
    if (selectedPreset !== "custom") {
      setSelectedPreset("custom");
    }
  };

  const handleGenerateFeatures = () => {
    if (!analysisId) {
      toast({
        title: "No analysis selected",
        description: "Please fetch stock data first",
        variant: "destructive",
      });
      return;
    }

    generateFeaturesMutation.mutate({
      analysisId,
      preset: selectedPreset,
      selectedFeatures,
      preprocessing: preprocessingOptions
    });
  };

  // Mock feature importance data
  const featureImportance = [
    { name: "Close Price", importance: 0.85 },
    { name: "SMA (20)", importance: 0.72 },
    { name: "Volume", importance: 0.45 },
    { name: "RSI", importance: 0.38 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Feature Selection Panel */}
      <Card className="bg-card dark:bg-dark-card border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="text-primary mr-2 w-5 h-5" />
            Feature Engineering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Feature Presets */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Feature Presets</Label>
            <div className="space-y-2">
              {featurePresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetChange(preset.id)}
                  className={`w-full p-3 text-left border rounded-lg transition-colors cursor-pointer ${
                    selectedPreset === preset.id
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        selectedPreset === preset.id ? "bg-primary" : "bg-gray-300"
                      }`} />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">{preset.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{preset.description}</div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedPreset === preset.id && preset.id === "custom" 
                        ? `${selectedFeatures.length} features`
                        : `${preset.count} features`
                      }
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Feature Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Available Features</Label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {availableFeatures.map((feature) => (
                <label
                  key={feature.id}
                  className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedFeatures.includes(feature.id)}
                    onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked as boolean)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{feature.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{feature.description}</div>
                  </div>
                  {selectedFeatures.includes(feature.id) && (
                    <span className="text-xs text-success">✓</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Data Preprocessing Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Preprocessing Pipeline</Label>
            <div className="space-y-2">
              <label className="flex items-center">
                <Checkbox
                  checked={preprocessingOptions.normalize}
                  onCheckedChange={(checked) => 
                    setPreprocessingOptions(prev => ({ ...prev, normalize: checked as boolean }))
                  }
                  className="mr-3"
                />
                <span className="text-sm text-gray-900 dark:text-white">Normalize features (0-1 scaling)</span>
              </label>
              <label className="flex items-center">
                <Checkbox
                  checked={preprocessingOptions.handleMissing}
                  onCheckedChange={(checked) => 
                    setPreprocessingOptions(prev => ({ ...prev, handleMissing: checked as boolean }))
                  }
                  className="mr-3"
                />
                <span className="text-sm text-gray-900 dark:text-white">Handle missing values</span>
              </label>
              <label className="flex items-center">
                <Checkbox
                  checked={preprocessingOptions.removeOutliers}
                  onCheckedChange={(checked) => 
                    setPreprocessingOptions(prev => ({ ...prev, removeOutliers: checked as boolean }))
                  }
                  className="mr-3"
                />
                <span className="text-sm text-gray-900 dark:text-white">Remove outliers (IQR method)</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Correlation Matrix */}
      <Card className="bg-card dark:bg-dark-card border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <GitBranch className="text-primary mr-2 w-5 h-5" />
            Feature Correlation Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Correlation Heatmap Placeholder */}
          <div className="mb-6">
            <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Correlation matrix will appear here</p>
            </div>
          </div>

          {/* Feature Importance */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Feature Importance</h3>
            <div className="space-y-3">
              {featureImportance.map((feature) => (
                <div key={feature.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900 dark:text-white">{feature.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${feature.importance * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                      {feature.importance.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Features Button */}
          <Button 
            onClick={handleGenerateFeatures}
            disabled={generateFeaturesMutation.isPending || !analysisId}
            className="w-full mt-6"
          >
            <Sparkles className="mr-2 w-4 h-4" />
            {generateFeaturesMutation.isPending ? "Generating..." : "Generate Features"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
