import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  Settings, 
  Brain, 
  BarChart3, 
  History, 
  Download, 
  Calculator,
  Cog
} from "lucide-react";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  {
    category: "Analysis",
    items: [
      { id: "data-collection", label: "Data Collection", icon: TrendingUp },
      { id: "feature-engineering", label: "Feature Engineering", icon: Cog },
      { id: "model-training", label: "Model Training", icon: Brain },
    ]
  },
  {
    category: "Results", 
    items: [
      { id: "forecasting", label: "Forecasting", icon: BarChart3 },
      { id: "backtesting", label: "Backtesting", icon: History },
      { id: "export-results", label: "Export Results", icon: Download },
    ]
  },
  {
    category: "Tools",
    items: [
      { id: "portfolio-analysis", label: "Portfolio Analysis", icon: Calculator },
      { id: "settings", label: "Settings", icon: Settings },
    ]
  }
];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-card dark:bg-dark-card shadow-lg border-r border-gray-200 dark:border-gray-700">
      <nav className="p-4 space-y-2">
        {navigationItems.map((category) => (
          <div key={category.category} className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {category.category}
            </h2>
            <div className="space-y-1">
              {category.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer w-full text-left",
                      activeSection === item.id
                        ? "bg-primary text-white hover:bg-primary-dark hover:text-white"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
