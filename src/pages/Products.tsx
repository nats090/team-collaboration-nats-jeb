import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import AddProductDialog from "@/components/AddProductDialog";
import EditProductDialog from "@/components/EditProductDialog";
import StockAdjustDialog from "@/components/StockAdjustDialog";
import GuideCard from "@/components/GuideCard";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Products = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<any>(null);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", searchQuery, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let countQuery = supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      if (searchQuery) {
        countQuery = countQuery.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }

      const { count } = await countQuery;

      let query = supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { products: data, totalCount: count || 0 };
    },
    enabled: !!user,
  });

  const products = productsData?.products || [];
  const totalPages = Math.ceil((productsData?.totalCount || 0) / itemsPerPage);

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });
      setDeletingProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground">Manage your inventory products</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        <GuideCard title="How to Manage Meat Products" icon={<BookOpen className="h-5 w-5 text-primary" />}>
          <ul className="space-y-2 list-disc list-inside">
            <li><strong>Add Product:</strong> Include photos, weight, expiration dates, batch numbers, and storage locations</li>
            <li><strong>Search:</strong> Find products by name or SKU code</li>
            <li><strong>Expiration Tracking:</strong> Orange badges show items expiring soon, red for expired</li>
            <li><strong>Storage Location:</strong> Track where each product is stored (Freezer/Refrigerator)</li>
            <li><strong>Adjust Stock:</strong> Record additions, removals, and sales with transaction history</li>
            <li><strong>Delete Sample Data:</strong> Use trash icon to remove the example products</li>
          </ul>
        </GuideCard>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading products...</div>
            ) : !products || products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No meat products yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first meat product to inventory
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product: any) => {
                  const isLowStock = product.current_stock <= product.min_stock_level;
                  const expirationDate = product.expiration_date ? new Date(product.expiration_date) : null;
                  const daysUntilExpiration = expirationDate ? Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                  const isExpired = daysUntilExpiration !== null && daysUntilExpiration < 0;
                  const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration >= 0 && daysUntilExpiration <= 7;
                  
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-md border"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{product.name}</h3>
                            {isLowStock && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Low Stock
                              </Badge>
                            )}
                            {isExpired && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                Expired
                              </Badge>
                            )}
                            {isExpiringSoon && (
                              <Badge className="bg-warning text-warning-foreground flex items-center gap-1">
                                Expires in {daysUntilExpiration}d
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                            <span>SKU: {product.sku}</span>
                            {product.categories && <span>• {product.categories.name}</span>}
                            <span>• Stock: {product.current_stock}</span>
                            {product.weight_kg && <span>• {product.weight_kg}kg</span>}
                            <span>• ${product.unit_price}/unit</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            {product.storage_location && <span>📍 {product.storage_location}</span>}
                            {product.batch_number && <span>• Batch: {product.batch_number}</span>}
                            {product.supplier && <span>• {product.supplier}</span>}
                            {expirationDate && <span>• Exp: {expirationDate.toLocaleDateString()}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjustingProduct(product)}
                        >
                          Adjust Stock
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingProduct(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!isLoading && products && products.length > 0 && totalPages > 1 && (
              <div className="mt-6 flex justify-center">
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
          </CardContent>
        </Card>
      </div>

      <AddProductDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
        />
      )}
      {adjustingProduct && (
        <StockAdjustDialog
          product={adjustingProduct}
          open={!!adjustingProduct}
          onOpenChange={(open) => !open && setAdjustingProduct(null)}
        />
      )}

      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingProduct.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Products;
