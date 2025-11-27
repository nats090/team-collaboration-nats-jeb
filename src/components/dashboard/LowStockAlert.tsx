import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LowStockProduct {
  id: string;
  name: string;
  current_stock: number;
  min_stock_level: number;
  category_name: string;
}

interface LowStockAlertProps {
  products: LowStockProduct[];
  isLoading: boolean;
}

const LowStockAlert = ({ products, isLoading }: LowStockAlertProps) => {
  const navigate = useNavigate();

  const getUrgency = (current: number, min: number) => {
    const ratio = current / min;
    if (ratio <= 0.25) return { label: "Critical", variant: "destructive" as const };
    if (ratio <= 0.5) return { label: "Low", variant: "secondary" as const };
    return { label: "Warning", variant: "outline" as const };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Low Stock Alert
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
            All products are well stocked!
          </p>
        ) : (
          <div className="space-y-3">
            {products.slice(0, 5).map((product) => {
              const urgency = getUrgency(product.current_stock, product.min_stock_level);
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
                        {product.current_stock} / {product.min_stock_level}
                      </p>
                      <p className="text-xs text-muted-foreground">Current / Min</p>
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

export default LowStockAlert;
