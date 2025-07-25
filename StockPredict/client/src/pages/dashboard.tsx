import { useState } from "react";
import Header from "@/components/dashboard/header";
import Sidebar from "@/components/dashboard/sidebar";
import StatsCards from "@/components/dashboard/stats-cards";
import DataCollection from "@/components/dashboard/data-collection";
import FeatureEngineering from "@/components/dashboard/feature-engineering";
import ModelTraining from "@/components/dashboard/model-training";
import ForecastingVisualization from "@/components/dashboard/forecasting-visualization";
import BacktestingResults from "@/components/dashboard/backtesting-results";
import ExportResults from "@/components/dashboard/export-results";

type Section = 
  | "data-collection"
  | "feature-engineering" 
  | "model-training"
  | "forecasting"
  | "backtesting"
  | "export-results"
  | "portfolio-analysis"
  | "settings";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<Section>("data-collection");
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);

  const renderContent = () => {
    switch (activeSection) {
      case "data-collection":
        return <DataCollection onAnalysisCreated={setCurrentAnalysisId} />;
      case "feature-engineering":
        return <FeatureEngineering analysisId={currentAnalysisId} />;
      case "model-training":
        return <ModelTraining analysisId={currentAnalysisId} />;
      case "forecasting":
        return <ForecastingVisualization analysisId={currentAnalysisId} />;
      case "backtesting":
        return <BacktestingResults analysisId={currentAnalysisId} />;
      case "export-results":
        return <ExportResults analysisId={currentAnalysisId} />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500 dark:text-gray-400">
              {activeSection.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())} coming soon...
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-dark-bg text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header />
      
      <div className="flex">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Stock Price Forecasting Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Analyze, predict, and optimize your investment strategies with advanced machine learning models
            </p>
          </div>

          {activeSection === "data-collection" && <StatsCards />}
          
          {renderContent()}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-card dark:bg-dark-card border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-600 dark:text-gray-400">
                © 2024 Akshat Sogani | 
                <a 
                  href="https://www.linkedin.com/in/akshat-sogani/" 
                  className="text-primary hover:text-primary-dark transition-colors ml-1" 
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">Built with</span>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">Python</span>
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">FastAPI</span>
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">Node.js</span>
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">ML</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
