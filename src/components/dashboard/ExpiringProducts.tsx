import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { differenceInDays, format } from "date-fns";

interface ExpiringProduct {
  id: string;
  name: string;
  expiration_date: string;
  category_name: string;
}

interface ExpiringProductsProps {
  products: ExpiringProduct[];
  isLoading: boolean;
}

const ExpiringProducts = ({ products, isLoading }: ExpiringProductsProps) => {
  const navigate = useNavigate();

  const getDaysRemaining = (date: string) => {
    return differenceInDays(new Date(date), new Date());
  };

  const getUrgency = (days: number) => {
    if (days <= 2) return { label: `${days}d`, variant: "destructive" as const };
    if (days <= 5) return { label: `${days}d`, variant: "secondary" as const };
    return { label: `${days}d`, variant: "outline" as const };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-destructive" />
          Expiring Soon
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => navigate("/products")}>
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No products expiring soon!
          </p>
        ) : (
          <div className="space-y-3">
            {products.slice(0, 5).map((product) => {
              const daysRemaining = getDaysRemaining(product.expiration_date);
              const urgency = getUrgency(daysRemaining);
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.category_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(product.expiration_date), "MMM dd, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">Expires</p>
                    </div>
                    <Badge variant={urgency.variant}>{urgency.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpiringProducts;
