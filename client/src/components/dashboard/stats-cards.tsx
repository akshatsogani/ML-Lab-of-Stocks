import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Target, TrendingUp, PieChart } from "lucide-react";

export default function StatsCards() {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    enabled: false, // Disabled for now since we don't have real stats yet
  });

  const statsData = [
    {
      title: "Active Models",
      value: "4",
      change: "+12%",
      changeLabel: "from last week",
      icon: Brain,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Avg Accuracy", 
      value: "87.3%",
      change: "+5.2%",
      changeLabel: "improvement",
      icon: Target,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "Stocks Analyzed",
      value: "156",
      change: "+23",
      changeLabel: "this month",
      icon: TrendingUp,
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    {
      title: "Sharpe Ratio",
      value: "2.45",
      change: "+0.3",
      changeLabel: "vs benchmark",
      icon: PieChart,
      color: "text-error",
      bgColor: "bg-error/10"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="bg-card dark:bg-dark-card border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${stat.color} text-xl w-6 h-6`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-success text-sm font-medium">{stat.change}</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm ml-2">{stat.changeLabel}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
