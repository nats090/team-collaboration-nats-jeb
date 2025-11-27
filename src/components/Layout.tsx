import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Package, LayoutDashboard, LogOut, FileText, Beef, Ham, Drumstick, Fish as FishIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error("Failed to sign out", {
        description: error.message,
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-card border-r min-h-screen p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">🥩 Meat Inventory</h1>
        </div>
        <nav className="space-y-2 flex-1">
          <Link
            to="/dashboard"
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors",
              location.pathname === "/dashboard" && "bg-accent"
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            to="/products"
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors",
              location.pathname === "/products" && "bg-accent"
            )}
          >
            <Package className="h-5 w-5" />
            All Products
          </Link>
          
          <div className="pt-4 pb-2">
            <h3 className="text-xs font-semibold text-muted-foreground px-3">MEAT CATEGORIES</h3>
          </div>
          
          <Link
            to="/beef"
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors",
              location.pathname === "/beef" && "bg-primary text-primary-foreground"
            )}
          >
            <Beef className="h-5 w-5" />
            Beef
          </Link>
          <Link
            to="/pork"
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors",
              location.pathname === "/pork" && "bg-secondary text-secondary-foreground"
            )}
          >
            <Ham className="h-5 w-5" />
            Pork
          </Link>
          <Link
            to="/chicken"
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors",
              location.pathname === "/chicken" && "bg-warning text-warning-foreground"
            )}
          >
            <Drumstick className="h-5 w-5" />
            Chicken
          </Link>
          <Link
            to="/fish"
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors",
              location.pathname === "/fish" && "bg-info text-info-foreground"
            )}
          >
            <FishIcon className="h-5 w-5" />
            Fish
          </Link>
          
          <div className="pt-4 pb-2">
            <h3 className="text-xs font-semibold text-muted-foreground px-3">MANAGEMENT</h3>
          </div>
          
          <Link
            to="/reports"
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors",
              location.pathname === "/reports" && "bg-accent"
            )}
          >
            <FileText className="h-5 w-5" />
            Reports
          </Link>
        </nav>
        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
};

export default Layout;
