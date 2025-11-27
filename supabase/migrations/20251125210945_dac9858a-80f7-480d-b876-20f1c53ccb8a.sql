-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING (true);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  current_stock INTEGER DEFAULT 0 NOT NULL,
  min_stock_level INTEGER DEFAULT 0 NOT NULL,
  unit_price DECIMAL(10,2) DEFAULT 0 NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (true);

-- Create inventory transactions table
CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('addition', 'removal', 'sale', 'adjustment')),
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view transactions"
  ON public.inventory_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert transactions"
  ON public.inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to update product stock
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.transaction_type IN ('addition', 'adjustment') THEN
    UPDATE public.products
    SET current_stock = current_stock + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.product_id;
  ELSIF NEW.transaction_type IN ('removal', 'sale') THEN
    UPDATE public.products
    SET current_stock = current_stock - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to automatically update stock on transaction
CREATE TRIGGER on_inventory_transaction
  AFTER INSERT ON public.inventory_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_product_stock();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();