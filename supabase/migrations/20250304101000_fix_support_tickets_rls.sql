-- Enable RLS on support_tickets table
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean state and avoid conflicts
DROP POLICY IF EXISTS "Tenants can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can insert tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.support_tickets;
DROP POLICY IF EXISTS "Allow select for own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Allow public access for super admin" ON public.support_tickets;

-- 1. INSERT POLICY
-- Allow authenticated users (Shop Owners) to create tickets
CREATE POLICY "Allow insert for authenticated users"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. SELECT POLICY (Authenticated)
-- Allow authenticated users to view only their own tickets or tickets for their tenant
CREATE POLICY "Allow select for own tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id 
    OR 
    tenant_id::text IN (
        SELECT id::text FROM public.tenants WHERE owner_id = auth.uid()
    )
);

-- 3. SUPER ADMIN ACCESS (Anon/Public)
-- Since Super Admin uses a custom local authentication (not Supabase Auth), 
-- we need to allow the 'anon' role to SELECT and UPDATE tickets to manage them.
-- NOTE: In a production environment with strict security, the Super Admin should 
-- use Supabase Auth or a Service Role Edge Function. This is a permissive fallback 
-- to ensure the current architecture works.

CREATE POLICY "Allow public select for super admin"
ON public.support_tickets
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow public update for super admin"
ON public.support_tickets
FOR UPDATE
TO anon
USING (true);
