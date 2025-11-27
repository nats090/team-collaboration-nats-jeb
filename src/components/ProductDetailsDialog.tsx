import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ProductDetailsDialogProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductDetailsDialog = ({ product, open, onOpenChange }: ProductDetailsDialogProps) => {
  if (!product) return null;

  const getExpirationStatus = (expirationDate: string | null) => {
    if (!expirationDate) return null;
    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      return { label: "Expired", variant: "destructive" as const };
    } else if (daysUntilExpiration <= 7) {
      return { label: "Expiring Soon", variant: "secondary" as const, className: "bg-warning text-warning-foreground" };
    }
    return { label: "Fresh", variant: "secondary" as const, className: "bg-success text-success-foreground" };
  };

  const expirationStatus = getExpirationStatus(product.expiration_date);
  const stockStatus = product.current_stock <= product.min_stock_level ? "Low Stock" : "In Stock";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {product.image_url && (
            <div className="w-full rounded-lg overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">SKU</p>
              <p className="font-semibold">{product.sku}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Unit Price</p>
              <p className="font-semibold text-xl">${product.unit_price}</p>
            </div>
          </div>

          {product.description && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-base">{product.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <div className="flex items-center gap-2">
                <p className={`font-semibold text-xl ${product.current_stock <= product.min_stock_level ? 'text-destructive' : 'text-success'}`}>
                  {product.current_stock} units
                </p>
                <Badge variant={product.current_stock <= product.min_stock_level ? "destructive" : "secondary"}>
                  {stockStatus}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Min Stock Level</p>
              <p className="font-semibold text-xl">{product.min_stock_level} units</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Weight</p>
              <p className="font-semibold">{product.weight_kg ? `${product.weight_kg} kg` : "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Storage Location</p>
              <p className="font-semibold">{product.storage_location || "N/A"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Expiration Date</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold">
                  {product.expiration_date ? format(new Date(product.expiration_date), "PPP") : "N/A"}
                </p>
                {expirationStatus && (
                  <Badge className={expirationStatus.className} variant={expirationStatus.variant}>
                    {expirationStatus.label}
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Batch Number</p>
              <p className="font-semibold">{product.batch_number || "N/A"}</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Supplier</p>
            <p className="font-semibold">{product.supplier || "N/A"}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm">{format(new Date(product.created_at), "PPpp")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-sm">{format(new Date(product.updated_at), "PPpp")}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;