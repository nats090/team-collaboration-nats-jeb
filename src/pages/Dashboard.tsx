import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import DashboardStats from "@/components/dashboard/DashboardStats";
import CategoryOverview from "@/components/dashboard/CategoryOverview";
import InventoryCharts from "@/components/dashboard/InventoryCharts";
import LowStockAlert from "@/components/dashboard/LowStockAlert";
import ExpiringProducts from "@/components/dashboard/ExpiringProducts";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [productsRes, allProductsRes, expiringRes] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*"),
        supabase.from("products").select("*").lte("expiration_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()).gte("expiration_date", new Date().toISOString()),
      ]);

      const products = allProductsRes.data || [];
      const lowStockCount = products.filter(p => p.current_stock <= p.min_stock_level).length;
      const totalValue = products.reduce((sum, p) => sum + (p.current_stock * Number(p.unit_price)), 0);

      return {
        totalProducts: productsRes.count || 0,
        lowStockProducts: lowStockCount,
        totalValue,
        expiringSoon: expiringRes.data?.length || 0,
      };
    },
    enabled: !!user,
  });

  // Fetch categories with product counts
  const { data: categoryData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["category-overview"],
    queryFn: async () => {
      const [categoriesRes, productsRes] = await Promise.all([
        supabase.from("categories").select("*"),
        supabase.from("products").select("*"),
      ]);

      const categories = categoriesRes.data || [];
      const products = productsRes.data || [];

      return categories.map(cat => {
        const categoryProducts = products.filter(p => p.category_id === cat.id);
        return {
          name: cat.name,
          productCount: categoryProducts.length,
          totalStock: categoryProducts.reduce((sum, p) => sum + p.current_stock, 0),
          route: `/${cat.name.toLowerCase()}`,
        };
      });
    },
    enabled: !!user,
  });

  // Fetch chart data
  const { data: chartData, isLoading: chartsLoading } = useQuery({
    queryKey: ["inventory-charts"],
    queryFn: async () => {
      const [categoriesRes, productsRes] = await Promise.all([
        supabase.from("categories").select("*"),
        supabase.from("products").select("*"),
      ]);

      const categories = categoriesRes.data || [];
      const products = productsRes.data || [];

      return categories.map(cat => {
        const categoryProducts = products.filter(p => p.category_id === cat.id);
        return {
          name: cat.name,
          value: categoryProducts.reduce((sum, p) => sum + (p.current_stock * Number(p.unit_price)), 0),
          stock: categoryProducts.reduce((sum, p) => sum + p.current_stock, 0),
        };
      });
    },
    enabled: !!user,
  });

  // Fetch low stock products
  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery({
    queryKey: ["low-stock-products"],
    queryFn: async () => {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("categories").select("*"),
      ]);

      const products = productsRes.data || [];
      const categories = categoriesRes.data || [];

      return products
        .filter(p => p.current_stock <= p.min_stock_level)
        .map(p => ({
          id: p.id,
          name: p.name,
          current_stock: p.current_stock,
          min_stock_level: p.min_stock_level,
          category_name: categories.find(c => c.id === p.category_id)?.name || "Unknown",
        }))
        .sort((a, b) => a.current_stock / a.min_stock_level - b.current_stock / b.min_stock_level);
    },
    enabled: !!user,
  });

  // Fetch expiring products
  const { data: expiringProducts, isLoading: expiringLoading } = useQuery({
    queryKey: ["expiring-products"],
    queryFn: async () => {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from("products").select("*").lte("expiration_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()).gte("expiration_date", new Date().toISOString()).order("expiration_date", { ascending: true }),
        supabase.from("categories").select("*"),
      ]);

      const products = productsRes.data || [];
      const categories = categoriesRes.data || [];

      return products.map(p => ({
        id: p.id,
        name: p.name,
        expiration_date: p.expiration_date!,
        category_name: categories.find(c => c.id === p.category_id)?.name || "Unknown",
      }));
    },
    enabled: !!user,
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}!
            </h1>
            <p className="text-muted-foreground">
              Here's your inventory overview for {format(new Date(), "MMMM d, yyyy")}
            </p>
          </div>
          {profile?.role && (
            <Badge variant="outline" className="w-fit capitalize">
              {profile.role}
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <DashboardStats
          totalProducts={stats?.totalProducts || 0}
          lowStockProducts={stats?.lowStockProducts || 0}
          totalValue={stats?.totalValue || 0}
          expiringSoon={stats?.expiringSoon || 0}
          isLoading={statsLoading}
        />

        {/* Category Overview */}
        <CategoryOverview
          categories={categoryData || []}
          isLoading={categoriesLoading}
        />

        {/* Charts */}
        <InventoryCharts
          data={chartData || []}
          isLoading={chartsLoading}
        />

        {/* Alerts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <LowStockAlert
            products={lowStockProducts || []}
            isLoading={lowStockLoading}
          />
          <ExpiringProducts
            products={expiringProducts || []}
            isLoading={expiringLoading}
          />
        </div>

        {/* Recent Activity */}
        <RecentActivity
          activities={recentActivity || []}
          isLoading={activityLoading}
        />

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </Layout>
  );
};

export default Dashboard;
