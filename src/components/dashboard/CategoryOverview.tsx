import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Beef, Fish } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryData {
  name: string;
  productCount: number;
  totalStock: number;
  route: string;
}

interface CategoryOverviewProps {
  categories: CategoryData[];
  isLoading: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  Beef: <Beef className="h-6 w-6" />,
  Pork: <span className="text-2xl">🐷</span>,
  Chicken: <span className="text-2xl">🐔</span>,
  Fish: <Fish className="h-6 w-6" />,
};

const CategoryOverview = ({ categories, isLoading }: CategoryOverviewProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => navigate(category.route)}
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors text-left"
            >
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {categoryIcons[category.name] || <span className="text-2xl">📦</span>}
              </div>
              <div>
                <h3 className="font-semibold">{category.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {category.productCount} products
                </p>
                <p className="text-sm text-muted-foreground">
                  {category.totalStock} units
                </p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryOverview;
