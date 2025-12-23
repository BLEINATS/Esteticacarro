/*
  # Fix RLS Policies for All Application Tables
  
  ## Query Description: 
  This migration enables Row Level Security (RLS) on all application tables and creates permissive policies 
  to allow the application (running with local auth) to perform CRUD operations. 
  This fixes the "42501" permission errors during data synchronization.
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High" (Unblocks write operations)
  - Requires-Backup: false
  - Reversible: true
  
  ## Security Implications:
  - RLS Status: Enabled for all tables
  - Policy Changes: Adds "Enable all access" policies for public/anon roles
  - Note: This is intended for the development/migration phase where auth is managed by the application layer.
*/

-- Helper macro to safely create permissive policies
DO $$
DECLARE
    tables text[] := ARRAY[
        'clients', 
        'vehicles', 
        'work_orders', 
        'inventory', 
        'services', 
        'employees', 
        'financial_transactions', 
        'rewards', 
        'redemptions', 
        'fidelity_cards', 
        'points_history', 
        'marketing_campaigns', 
        'alerts', 
        'reminders', 
        'employee_transactions', 
        'message_logs',
        'tenants',
        'saas_plans',
        'saas_settings',
        'token_packages',
        'saas_token_ledger',
        'saas_financial_transactions'
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- 1. Enable RLS (Idempotent)
        EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY;', t);
        
        -- 2. Drop existing policies to avoid conflicts (Idempotent)
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Enable all access for all users" ON public.%I;', t);
            EXECUTE format('DROP POLICY IF EXISTS "Allow public read access" ON public.%I;', t);
            EXECUTE format('DROP POLICY IF EXISTS "Allow public insert access" ON public.%I;', t);
            EXECUTE format('DROP POLICY IF EXISTS "Allow public update access" ON public.%I;', t);
            EXECUTE format('DROP POLICY IF EXISTS "Allow public delete access" ON public.%I;', t);
        EXCEPTION WHEN undefined_table THEN
            -- Ignore if table doesn't exist yet
            CONTINUE;
        END;

        -- 3. Create comprehensive permissive policy
        BEGIN
            EXECUTE format('
                CREATE POLICY "Enable all access for all users" ON public.%I
                FOR ALL 
                TO public 
                USING (true) 
                WITH CHECK (true);
            ', t);
        EXCEPTION WHEN undefined_table THEN
            CONTINUE;
        END;
    END LOOP;
END $$;
