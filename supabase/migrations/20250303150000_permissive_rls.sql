/*
  # Fix RLS Policies for Local-First Sync
  
  This migration enables Row Level Security on all tables but adds a permissive policy
  to allow the application (using the anonymous key) to perform CRUD operations.
  
  This is necessary because the application currently handles authentication locally/independently
  and syncs data to Supabase. Without this, Supabase rejects writes from the client.
*/

DO $$ 
DECLARE 
    -- List of all tables in the application
    tables text[] := ARRAY[
        'tenants', 
        'users', 
        'clients', 
        'vehicles', 
        'work_orders', 
        'inventory', 
        'services', 
        'employees', 
        'employee_transactions', 
        'financial_transactions', 
        'rewards', 
        'redemptions', 
        'fidelity_cards', 
        'points_history', 
        'marketing_campaigns', 
        'alerts', 
        'reminders', 
        'message_logs', 
        'saas_settings', 
        'saas_plans', 
        'token_packages', 
        'saas_token_ledger', 
        'saas_financial_transactions'
    ];
    t text;
BEGIN 
    FOREACH t IN ARRAY tables LOOP 
        -- 1. Enable RLS (Best practice, even if policy is open)
        EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', t);
        
        -- 2. Drop existing restrictive or duplicate policies to ensure clean slate
        EXECUTE format('DROP POLICY IF EXISTS "Enable all access for public" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow public read access" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow public insert" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow public update" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow public delete" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON %I', t);
        
        -- 3. Create a single permissive policy for ALL operations
        -- This allows SELECT, INSERT, UPDATE, DELETE for anyone with the API key
        EXECUTE format('CREATE POLICY "Enable all access for public" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP; 
END $$;
