-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users see own products, admins see all" ON public.products;

-- Create new SELECT policy: All authenticated users can view all products
CREATE POLICY "All authenticated users can view products"
ON public.products
FOR SELECT
TO authenticated
USING (true);

-- Also fix inventory_transactions SELECT policy for staff to see transaction history
DROP POLICY IF EXISTS "Users see own transactions, admins see all" ON public.inventory_transactions;

CREATE POLICY "All authenticated users can view transactions"
ON public.inventory_transactions
FOR SELECT
TO authenticated
USING (true);