import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
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

interface StockAdjustDialogProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StockAdjustDialog = ({ product, open, onOpenChange }: StockAdjustDialogProps) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const adjustMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const transactionData = {
        product_id: product.id,
        transaction_type: formData.get("transaction_type") as string,
        quantity: parseInt(formData.get("quantity") as string),
        notes: formData.get("notes") as string,
        created_by: user?.id,
      };

      const { error } = await supabase
        .from("inventory_transactions")
        .insert(transactionData);
      if (error) throw error;
      return transactionData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["beef-products"] });
      queryClient.invalidateQueries({ queryKey: ["pork-products"] });
      queryClient.invalidateQueries({ queryKey: ["chicken-products"] });
      queryClient.invalidateQueries({ queryKey: ["fish-products"] });
      toast.success("Stock adjusted successfully");
      logActivity({
        activityType: data.transaction_type === "addition" ? "stock_added" : 
                     data.transaction_type === "removal" ? "stock_removed" : "stock_adjusted",
        entityType: "stock",
        entityId: product.id,
        entityName: product.name,
        description: `${data.transaction_type} - ${data.quantity} units for ${product.name}`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to adjust stock");
    },
  });

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    await adjustMutation.mutateAsync(formData);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            Adjust inventory for {product.name} (Current: {product.current_stock})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transaction_type">Transaction Type *</Label>
            <Select name="transaction_type" required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="addition">Stock Addition</SelectItem>
                <SelectItem value="removal">Stock Removal</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adjusting..." : "Adjust Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockAdjustDialog;
