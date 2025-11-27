import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { TrendingDown, BarChart3, Plus } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

const QuickActions = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();

  const adminActions = [
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
  ];

  const commonActions = [
    {
      icon: BarChart3,
      title: "View Reports",
      description: "Analyze inventory data",
      onClick: () => navigate("/reports"),
      color: "text-primary",
    },
  ];

  const actions = isAdmin ? [...adminActions, ...commonActions] : commonActions;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-3 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-1'}`}>
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
