import { Moon, Sun, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-card dark:bg-dark-card shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AS</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">ForecastLab</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">by Akshat Sogani</p>
            </div>
          </div>

          {/* Navigation and Controls */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600" />
              )}
            </Button>
            
            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
              </Button>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">AS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
