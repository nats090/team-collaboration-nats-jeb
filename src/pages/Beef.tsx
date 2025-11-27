import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AddProductDialog from "@/components/AddProductDialog";
import EditProductDialog from "@/components/EditProductDialog";
import StockAdjustDialog from "@/components/StockAdjustDialog";
import ProductDetailsDialog from "@/components/ProductDetailsDialog";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function Beef() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [adjustingStock, setAdjustingStock] = useState<any>(null);
  const [viewingProduct, setViewingProduct] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();

  const { data: category } = useQuery({
    queryKey: ["beef-category"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("name", "Beef")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["beef-products", category?.id, currentPage],
    enabled: !!category,
    queryFn: async () => {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("category_id", category.id);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", category.id)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { products: data, totalCount: count || 0 };
    },
  });

  const products = productsData?.products || [];
  const totalPages = Math.ceil((productsData?.totalCount || 0) / itemsPerPage);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const product = products?.find(p => p.id === id);
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      return product;
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["beef-products"] });
      toast.success("Product deleted successfully");
      logActivity({
        activityType: "product_deleted",
        entityType: "product",
        entityId: product?.id,
        entityName: product?.name,
        description: `Deleted beef product: ${product?.name}`,
      });
    },
  });

  const getExpirationBadge = (expirationDate: string | null) => {
    if (!expirationDate) return null;
    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (daysUntilExpiration <= 7) {
      return <Badge className="bg-warning text-warning-foreground">Expiring Soon</Badge>;
    }
    return null;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Beef Products</h1>
            <p className="text-muted-foreground">Manage your beef inventory</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Beef Product
            </Button>
          )}
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products?.map((product) => (
              <Card 
                key={product.id} 
                className="hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                onClick={() => setViewingProduct(product)}
              >
                {product.image_url && (
                  <div className="w-full h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                    </div>
                    {getExpirationBadge(product.expiration_date)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stock:</span>
                      <span className={`font-semibold ${product.current_stock <= product.min_stock_level ? 'text-destructive' : 'text-success'}`}>
                        {product.current_stock} units
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Weight:</span>
                      <span>{product.weight_kg} kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{product.storage_location || "N/A"}</span>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjustingStock(product)}
                          className="flex-1"
                        >
                          Adjust Stock
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && products && products.length > 0 && totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <AddProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
      <EditProductDialog
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        product={editingProduct}
      />
      <StockAdjustDialog
        open={!!adjustingStock}
        onOpenChange={(open) => !open && setAdjustingStock(null)}
        product={adjustingStock}
      />
      <ProductDetailsDialog
        open={!!viewingProduct}
        onOpenChange={(open) => !open && setViewingProduct(null)}
        product={viewingProduct}
      />
    </Layout>
  );
}
