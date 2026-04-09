
-- 1. Fix staff_role_flags: restrict INSERT/UPDATE/DELETE to admin/HM only
-- First drop the permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated can insert staff_role_flags" ON public.staff_role_flags;
DROP POLICY IF EXISTS "Authenticated can update staff_role_flags" ON public.staff_role_flags;

-- Create restricted write policies
CREATE POLICY "Admin/HM can insert staff_role_flags"
ON public.staff_role_flags FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'house_manager'::app_role));

CREATE POLICY "Admin/HM can update staff_role_flags"
ON public.staff_role_flags FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'house_manager'::app_role));

CREATE POLICY "Admin/HM can delete staff_role_flags"
ON public.staff_role_flags FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'house_manager'::app_role));

-- 2. Fix user_roles: restrict writes to admin only
DROP POLICY IF EXISTS "Authenticated can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated can update user_roles" ON public.user_roles;

CREATE POLICY "Admin can insert user_roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update user_roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete user_roles"
ON public.user_roles FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix invoices: restrict writes to admin/HM
DROP POLICY IF EXISTS "Authenticated can insert invoices" ON public.invoices;

CREATE POLICY "Admin/HM can insert invoices"
ON public.invoices FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'house_manager'::app_role));

-- 4. Fix invoice_line_items: restrict writes to admin/HM
DROP POLICY IF EXISTS "Authenticated can insert invoice_line_items" ON public.invoice_line_items;

CREATE POLICY "Admin/HM can insert invoice_line_items"
ON public.invoice_line_items FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'house_manager'::app_role));

-- 5. Fix incidents: restrict UPDATE/DELETE to admin/HM (keep INSERT open for reporting)
DROP POLICY IF EXISTS "Authenticated can update incidents" ON public.incidents;
DROP POLICY IF EXISTS "Authenticated can delete incidents" ON public.incidents;

CREATE POLICY "Admin/HM can update incidents"
ON public.incidents FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'house_manager'::app_role));

CREATE POLICY "Admin/HM can delete incidents"
ON public.incidents FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'house_manager'::app_role));

-- 6. Make documents storage bucket private
UPDATE storage.buckets SET public = false WHERE id = 'documents';
