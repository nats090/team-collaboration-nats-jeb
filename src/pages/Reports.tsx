import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

declare module "jspdf" {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

export default function Reports() {
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const { data: activities, isLoading } = useQuery({
    queryKey: ["activity-logs", activityFilter, entityFilter],
    queryFn: async () => {
      let query = supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (activityFilter !== "all") {
        query = query.eq("activity_type", activityFilter);
      }

      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const exportToPDF = () => {
    if (!activities || activities.length === 0) {
      toast.error("No activities to export. Please adjust filters or add some activities first.");
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Add logo/header
      doc.setFontSize(20);
      doc.setTextColor(220, 38, 38);
      doc.text("Meat Inventory System", 105, 20, { align: "center" });
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Activity Report", 105, 30, { align: "center" });
      
      // Report details
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), "PPpp")}`, 20, 45);
      doc.text(`Filter: ${activityFilter === "all" ? "All Activities" : activityFilter}`, 20, 52);
      doc.text(`Entity: ${entityFilter === "all" ? "All Entities" : entityFilter}`, 20, 59);
      
      // Add decorative element on the right
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("Powered by Meat Inventory", 150, 45);
      doc.text("Total Records: " + activities.length, 150, 52);
      
      // Table
      const tableData = activities.map((activity) => [
        format(new Date(activity.created_at), "PPpp"),
        activity.activity_type,
        activity.entity_type,
        activity.entity_name || "N/A",
        activity.description,
      ]);

      autoTable(doc, {
        startY: 70,
        head: [["Date", "Activity", "Entity Type", "Entity", "Description"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [220, 38, 38] },
        styles: { fontSize: 8 },
      });

      doc.save(`meat-inventory-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-accent">Activity Reports</h1>
            <p className="text-muted-foreground">View and export system activity logs</p>
          </div>
          <Button onClick={exportToPDF} className="bg-accent hover:bg-accent/90">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="product_created">Product Created</SelectItem>
                <SelectItem value="product_updated">Product Updated</SelectItem>
                <SelectItem value="product_deleted">Product Deleted</SelectItem>
                <SelectItem value="stock_added">Stock Added</SelectItem>
                <SelectItem value="stock_removed">Stock Removed</SelectItem>
                <SelectItem value="stock_adjusted">Stock Adjusted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading activities...</div>
            ) : (
              <div className="space-y-4">
                {activities?.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{activity.entity_name || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">
                          {activity.activity_type.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {format(new Date(activity.created_at), "PPpp")}
                    </span>
                  </div>
                ))}
                {activities?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No activities found matching the filters.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
