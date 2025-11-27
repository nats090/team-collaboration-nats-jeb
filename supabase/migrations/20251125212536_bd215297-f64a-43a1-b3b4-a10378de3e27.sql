-- Add meat-specific columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS expiration_date DATE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS batch_number TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS storage_location TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier TEXT;

-- Update categories for meat types
DELETE FROM public.categories;
INSERT INTO public.categories (name, description) VALUES
('Beef', 'Beef and cattle meat products'),
('Pork', 'Pork and pig meat products'),
('Chicken', 'Chicken and poultry products'),
('Fish', 'Fish and seafood products'),
('Processed', 'Processed and cured meats')
ON CONFLICT DO NOTHING;