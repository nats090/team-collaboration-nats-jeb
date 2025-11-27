import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingDown, ShoppingCart, AlertTriangle, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import GuideCard from "@/components/GuideCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [productsRes, allProductsRes, transactionsRes, expiringRes] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*"),
        supabase.from("inventory_transactions").select("*").eq("transaction_type", "sale").gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from("products").select("*").lte("expiration_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const lowStockCount = allProductsRes.data?.filter(p => p.current_stock <= p.min_stock_level).length || 0;

      return {
        totalProducts: productsRes.count || 0,
        lowStockProducts: lowStockCount,
        recentSales: transactionsRes.data?.length || 0,
        expiringSoon: expiringRes.data?.length || 0,
      };
    },
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your inventory overview.</p>
        </div>

        <GuideCard title="Getting Started Guide" icon={<BookOpen className="h-5 w-5 text-primary" />}>
          <ul className="space-y-2 list-disc list-inside">
            <li><strong>Total Products:</strong> Shows how many different meat items you have in stock</li>
            <li><strong>Low Stock Items:</strong> Products that need restocking (below minimum level)</li>
            <li><strong>Sales:</strong> Number of sales recorded in the last 30 days</li>
            <li><strong>Expiring Soon:</strong> Track items near expiration to prevent waste</li>
            <li><strong>Quick Actions:</strong> Click any card below to jump to that feature</li>
          </ul>
        </GuideCard>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
                  <p className="text-xs text-muted-foreground">Active SKUs in inventory</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-warning">{stats?.lowStockProducts || 0}</div>
                  <p className="text-xs text-muted-foreground">Need restocking</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sales (30d)</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.recentSales || 0}</div>
                  <p className="text-xs text-muted-foreground">Transactions this month</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-destructive">{stats?.expiringSoon || 0}</div>
                  <p className="text-xs text-muted-foreground">Items expiring in 7 days</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <button
                onClick={() => navigate("/products")}
                className="p-4 text-left border rounded-lg hover:bg-accent transition-colors"
              >
                <Package className="h-5 w-5 mb-2 text-primary" />
                <h3 className="font-medium">Manage Products</h3>
                <p className="text-sm text-muted-foreground">Add, edit, or remove products</p>
              </button>
              <button
                onClick={() => navigate("/products")}
                className="p-4 text-left border rounded-lg hover:bg-accent transition-colors"
              >
                <TrendingDown className="h-5 w-5 mb-2 text-primary" />
                <h3 className="font-medium">Adjust Stock</h3>
                <p className="text-sm text-muted-foreground">Update inventory levels</p>
              </button>
              <button
                onClick={() => navigate("/products")}
                className="p-4 text-left border rounded-lg hover:bg-accent transition-colors"
              >
                <AlertTriangle className="h-5 w-5 mb-2 text-warning" />
                <h3 className="font-medium">Low Stock Alert</h3>
                <p className="text-sm text-muted-foreground">View items needing restock</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
