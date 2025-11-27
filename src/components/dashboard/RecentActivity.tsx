import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Activity, Plus, Edit, Trash2, Package, ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: string;
  activity_type: string;
  entity_type: string;
  entity_name: string | null;
  description: string;
  created_at: string;
}

interface RecentActivityProps {
  activities: ActivityLog[];
  isLoading: boolean;
}

const activityIcons: Record<string, React.ReactNode> = {
  product_created: <Plus className="h-4 w-4 text-primary" />,
  product_updated: <Edit className="h-4 w-4 text-primary" />,
  product_deleted: <Trash2 className="h-4 w-4 text-destructive" />,
  stock_added: <ArrowUp className="h-4 w-4 text-primary" />,
  stock_removed: <ArrowDown className="h-4 w-4 text-warning" />,
  stock_adjusted: <Package className="h-4 w-4 text-primary" />,
  category_created: <Plus className="h-4 w-4 text-primary" />,
  category_updated: <Edit className="h-4 w-4 text-primary" />,
  category_deleted: <Trash2 className="h-4 w-4 text-destructive" />,
};

const RecentActivity = ({ activities, isLoading }: RecentActivityProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => navigate("/reports")}>
          View Reports
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-full">
                  {activityIcons[activity.activity_type] || <Activity className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.description}</p>
                  {activity.entity_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.entity_name}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
