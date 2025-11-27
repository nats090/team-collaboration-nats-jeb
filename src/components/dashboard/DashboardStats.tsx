import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, DollarSign, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatsProps {
  totalProducts: number;
  lowStockProducts: number;
  totalValue: number;
  expiringSoon: number;
  isLoading: boolean;
}

const DashboardStats = ({
  totalProducts,
  lowStockProducts,
  totalValue,
  expiringSoon,
  isLoading,
}: DashboardStatsProps) => {
  const stats = [
    {
      title: "Total Products",
      value: totalProducts,
      icon: Package,
      description: "Active SKUs in inventory",
      color: "text-primary",
    },
    {
      title: "Low Stock Items",
      value: lowStockProducts,
      icon: AlertTriangle,
      description: "Need restocking",
      color: "text-warning",
      valueColor: "text-warning",
    },
    {
      title: "Inventory Value",
      value: `₱${totalValue.toLocaleString()}`,
      icon: DollarSign,
      description: "Total stock value",
      color: "text-primary",
    },
    {
      title: "Expiring Soon",
      value: expiringSoon,
      icon: Clock,
      description: "Within 7 days",
      color: "text-destructive",
      valueColor: "text-destructive",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${stat.valueColor || ""}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
