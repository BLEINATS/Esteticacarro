-- Fix RLS for support_tickets by recreating policies cleanly
BEGIN;

-- Enable RLS (ensure it is on)
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for this table to avoid "policy already exists" errors
DROP POLICY IF EXISTS "Tenants can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Tenants can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Authenticated users can insert tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Authenticated users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Authenticated users can update own tickets" ON public.support_tickets;

-- 1. Allow Authenticated Users (Shop Owners) to INSERT their own tickets
-- The user_id in the row must match the authenticated user's ID
CREATE POLICY "Authenticated users can insert tickets"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Allow Authenticated Users to VIEW their own tickets
CREATE POLICY "Authenticated users can view own tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Allow Authenticated Users to UPDATE their own tickets
CREATE POLICY "Authenticated users can update own tickets"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Allow Anon access for Super Admin (Temporary for Prototype)
-- Since Super Admin uses a custom login and not Supabase Auth in this version,
-- we allow anon SELECT/UPDATE to ensure the Admin Dashboard works.
-- In production, Super Admin should be a real authenticated user with a role.
CREATE POLICY "Anon admin can view tickets"
ON public.support_tickets
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon admin can update tickets"
ON public.support_tickets
FOR UPDATE
TO anon
USING (true);

COMMIT;
