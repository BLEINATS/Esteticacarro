/*
  # Fix Support Tickets RLS Policies
  
  ## Query Description:
  This migration resets and re-defines the Row Level Security (RLS) policies for the `support_tickets` table.
  It addresses the "new row violates row-level security policy" error by explicitly allowing authenticated users to INSERT tickets.
  It also ensures the Super Admin (who operates as 'anon' in this architecture) can view and manage tickets.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table: `support_tickets`
  - Policies: 
    - Drop existing policies to prevent conflicts.
    - Create `Authenticated users can insert tickets` (INSERT)
    - Create `Authenticated users can view own tickets` (SELECT)
    - Create `Authenticated users can update own tickets` (UPDATE)
    - Create `Anon can manage tickets` (ALL) - Required for Super Admin custom auth flow.

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes, permissive for anon to support custom admin, strict for authenticated users.
*/

-- Enable RLS (idempotent)
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure a clean slate and avoid "policy already exists" errors
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Tenants can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Anon can view tickets" ON support_tickets;
DROP POLICY IF EXISTS "Authenticated users can insert tickets" ON support_tickets;
DROP POLICY IF EXISTS "Authenticated users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Authenticated users can update own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Anon can manage tickets" ON support_tickets;

-- Policy 1: Allow Authenticated users (Shop Owners) to INSERT tickets
CREATE POLICY "Authenticated users can insert tickets"
ON support_tickets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 2: Allow Authenticated users to VIEW their own tickets
-- Checks if the auth.uid() matches the user_id on the ticket
CREATE POLICY "Authenticated users can view own tickets"
ON support_tickets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 3: Allow Authenticated users to UPDATE their own tickets (e.g. to close them)
CREATE POLICY "Authenticated users can update own tickets"
ON support_tickets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy 4: Allow Anon (Super Admin) to VIEW/UPDATE all tickets
-- This is required because the Super Admin dashboard uses a custom authentication method 
-- that does not sign in to Supabase Auth, thus requests originate from the 'anon' role.
CREATE POLICY "Anon can manage tickets"
ON support_tickets
FOR ALL
TO anon
USING (true)
WITH CHECK (true);
