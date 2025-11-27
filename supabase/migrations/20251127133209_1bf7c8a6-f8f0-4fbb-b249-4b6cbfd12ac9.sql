-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'staff',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Function to check if user has a specific role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to handle new user role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, COALESCE((new.raw_user_meta_data->>'role')::app_role, 'staff'));
  RETURN new;
END;
$$;

-- Trigger to auto-assign role on user creation
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Drop existing RLS policies on products
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

-- New RLS policies for products based on roles
-- SELECT: Users see their own products, admins see all
CREATE POLICY "Users see own products, admins see all"
ON public.products
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  OR public.has_role(auth.uid(), 'admin')
);

-- INSERT: Only admins can add products
CREATE POLICY "Only admins can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- UPDATE: Only admins can update
CREATE POLICY "Only admins can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- DELETE: Only admins can delete
CREATE POLICY "Only admins can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update inventory_transactions policies
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON public.inventory_transactions;

-- SELECT: Users see transactions for their products, admins see all
CREATE POLICY "Users see own transactions, admins see all"
ON public.inventory_transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = inventory_transactions.product_id 
    AND (products.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- INSERT: Only admins can create transactions
CREATE POLICY "Only admins can insert transactions"
ON public.inventory_transactions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));