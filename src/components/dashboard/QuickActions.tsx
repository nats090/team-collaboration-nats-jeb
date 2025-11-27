import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Package, TrendingDown, AlertTriangle, BarChart3, Plus } from "lucide-react";

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Plus,
      title: "Add Product",
      description: "Add new items to inventory",
      onClick: () => navigate("/products"),
      color: "text-primary",
    },
    {
      icon: TrendingDown,
      title: "Adjust Stock",
      description: "Update inventory levels",
      onClick: () => navigate("/products"),
      color: "text-primary",
    },
    {
      icon: BarChart3,
      title: "View Reports",
      description: "Analyze inventory data",
      onClick: () => navigate("/reports"),
      color: "text-primary",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          {actions.map((action) => (
            <button
              key={action.title}
              onClick={action.onClick}
              className="p-4 text-left border rounded-lg hover:bg-accent transition-colors"
            >
              <action.icon className={`h-5 w-5 mb-2 ${action.color}`} />
              <h3 className="font-medium">{action.title}</h3>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
