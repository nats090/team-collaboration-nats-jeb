import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import { ImagePlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditProductDialogProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditProductDialog = ({ product, open, onOpenChange }: EditProductDialogProps) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!product,
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      let imageUrl = product.image_url;
      
      // Upload new image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      const productData = {
        name: formData.get("name") as string,
        sku: formData.get("sku") as string,
        description: formData.get("description") as string,
        category_id: formData.get("category_id") as string || null,
        min_stock_level: parseInt(formData.get("min_stock_level") as string) || 0,
        unit_price: parseFloat(formData.get("unit_price") as string) || 0,
        weight_kg: formData.get("weight_kg") ? parseFloat(formData.get("weight_kg") as string) : null,
        expiration_date: formData.get("expiration_date") as string || null,
        batch_number: formData.get("batch_number") as string || null,
        storage_location: formData.get("storage_location") as string || null,
        supplier: formData.get("supplier") as string || null,
        image_url: imageUrl,
      };

      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", product.id);
      if (error) throw error;
      return productData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["beef-products"] });
      queryClient.invalidateQueries({ queryKey: ["pork-products"] });
      queryClient.invalidateQueries({ queryKey: ["chicken-products"] });
      queryClient.invalidateQueries({ queryKey: ["fish-products"] });
      toast.success("Product updated successfully");
      logActivity({
        activityType: "product_updated",
        entityType: "product",
        entityId: product.id,
        entityName: data.name,
        description: `Updated product: ${data.name}`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update product");
    },
  });

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    await updateMutation.mutateAsync(formData);
    setIsLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Meat Product</DialogTitle>
          <DialogDescription>Update meat product information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                  <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Add Photo</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input id="edit-name" name="name" defaultValue={product.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sku">SKU *</Label>
              <Input id="edit-sku" name="sku" defaultValue={product.sku} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={product.description}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category_id">Category</Label>
              <Select name="category_id" defaultValue={product.category_id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unit_price">Unit Price *</Label>
              <Input
                id="edit-unit_price"
                name="unit_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product.unit_price}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-min_stock_level">Min Stock Level *</Label>
            <Input
              id="edit-min_stock_level"
              name="min_stock_level"
              type="number"
              min="0"
              defaultValue={product.min_stock_level}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-weight_kg">Weight (kg)</Label>
              <Input
                id="edit-weight_kg"
                name="weight_kg"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product.weight_kg}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expiration_date">Expiration Date</Label>
              <Input
                id="edit-expiration_date"
                name="expiration_date"
                type="date"
                defaultValue={product.expiration_date}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-batch_number">Batch Number</Label>
              <Input
                id="edit-batch_number"
                name="batch_number"
                defaultValue={product.batch_number}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-storage_location">Storage Location</Label>
              <Input
                id="edit-storage_location"
                name="storage_location"
                defaultValue={product.storage_location}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-supplier">Supplier</Label>
            <Input
              id="edit-supplier"
              name="supplier"
              defaultValue={product.supplier}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
