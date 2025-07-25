import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Code, FileSpreadsheet, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ExportResultsProps {
  analysisId: string | null;
}

export default function ExportResults({ analysisId }: ExportResultsProps) {
  const { toast } = useToast();

  const { data: exportHistory } = useQuery({
    queryKey: ["/api/export/history"],
  });

  const exportCSVMutation = useMutation({
    mutationFn: async (dataType: string) => {
      const response = await apiRequest("POST", "/api/export/csv", {
        analysisId,
        dataType
      });
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataType}_${analysisId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "CSV exported",
        description: "File has been downloaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const exportJSONMutation = useMutation({
    mutationFn: async (dataType: string) => {
      const response = await apiRequest("POST", "/api/export/json", {
        analysisId,
        dataType
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forecast_${analysisId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "JSON exported",
        description: "File has been downloaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      // Mock PDF generation - in real implementation, this would call the backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "PDF report generated",
        description: "Comprehensive analysis report has been created",
      });
    },
    onError: (error) => {
      toast({
        title: "Report generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const shareLinkMutation = useMutation({
    mutationFn: async () => {
      // Mock share link generation
      const shareLink = `${window.location.origin}/shared/${analysisId}`;
      await navigator.clipboard.writeText(shareLink);
      return { shareLink };
    },
    onSuccess: (data) => {
      toast({
        title: "Share link copied",
        description: "Shareable forecast URL has been copied to clipboard",
      });
    },
    onError: (error) => {
      toast({
        title: "Share failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const exportOptions = [
    {
      id: "csv",
      title: "Export to CSV",
      description: "Forecast data & metrics",
      icon: FileSpreadsheet,
      color: "text-success",
      action: () => exportCSVMutation.mutate("forecast"),
      loading: exportCSVMutation.isPending
    },
    {
      id: "json",
      title: "Export to JSON", 
      description: "Structured data format",
      icon: Code,
      color: "text-primary",
      action: () => exportJSONMutation.mutate("forecast"),
      loading: exportJSONMutation.isPending
    },
    {
      id: "pdf",
      title: "PDF Report",
      description: "Comprehensive analysis",
      icon: FileText,
      color: "text-error",
      action: () => generateReportMutation.mutate(),
      loading: generateReportMutation.isPending
    },
    {
      id: "share",
      title: "Share Link",
      description: "Shareable forecast URL",
      icon: Share2,
      color: "text-warning",
      action: () => shareLinkMutation.mutate(),
      loading: shareLinkMutation.isPending
    }
  ];

  // Mock recent exports data
  const recentExports = [
    {
      id: "1",
      fileName: "AAPL_forecast_2024-01-15.csv",
      type: "csv",
      createdAt: "2 hours ago",
      icon: FileSpreadsheet
    },
    {
      id: "2",
      fileName: "Portfolio_Analysis_Report.pdf",
      type: "pdf", 
      createdAt: "yesterday",
      icon: FileText
    }
  ];

  const handleExportAction = (action: () => void) => {
    if (!analysisId) {
      toast({
        title: "No analysis selected",
        description: "Please complete analysis first to export results",
        variant: "destructive",
      });
      return;
    }
    action();
  };

  return (
    <Card className="bg-card dark:bg-dark-card border border-gray-200 dark:border-gray-700 mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Download className="text-primary mr-2 w-5 h-5" />
          Export & Share Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Export Options */}
          {exportOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.id}
                variant="outline"
                onClick={() => handleExportAction(option.action)}
                disabled={option.loading || !analysisId}
                className="flex flex-col items-center justify-center p-6 h-auto border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Icon className={`${option.color} text-2xl mb-2 w-8 h-8`} />
                <div className="font-medium text-gray-900 dark:text-white text-center">
                  {option.loading ? "Processing..." : option.title}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  {option.description}
                </div>
              </Button>
            );
          })}
        </div>

        {/* Recent Exports */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Recent Exports</h3>
          <div className="space-y-2">
            {recentExports.map((exportItem) => {
              const Icon = exportItem.icon;
              return (
                <div
                  key={exportItem.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${
                      exportItem.type === "csv" ? "text-success" :
                      exportItem.type === "pdf" ? "text-error" : "text-primary"
                    }`} />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {exportItem.fileName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Exported {exportItem.createdAt}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}

            {recentExports.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No exports yet</p>
                <p className="text-sm">Export analysis results to see them here</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
