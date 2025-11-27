import { supabase } from "@/integrations/supabase/client";

export type ActivityType = 
  | "product_created"
  | "product_updated"
  | "product_deleted"
  | "stock_added"
  | "stock_removed"
  | "stock_adjusted"
  | "category_created"
  | "category_updated"
  | "category_deleted";

export type EntityType = "product" | "category" | "stock";

interface LogActivityParams {
  activityType: ActivityType;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  description: string;
  metadata?: Record<string, any>;
}

export async function logActivity({
  activityType,
  entityType,
  entityId,
  entityName,
  description,
  metadata,
}: LogActivityParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("activity_logs").insert({
      activity_type: activityType,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      description,
      metadata,
      user_id: user?.id,
    });

    if (error) {
      console.error("Failed to log activity:", error);
    }
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
