-- Create activity_logs table for tracking all system activities
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view activity logs"
ON public.activity_logs
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for faster queries
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_activity_type ON public.activity_logs(activity_type);
CREATE INDEX idx_activity_logs_entity_type ON public.activity_logs(entity_type);