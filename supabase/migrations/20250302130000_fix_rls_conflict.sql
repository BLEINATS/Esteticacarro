/*
  # Fix RLS Policies Conflict
  
  ## Query Description:
  This migration fixes the "policy already exists" error by dropping existing policies before re-creating them.
  It ensures Row Level Security is enabled and configured correctly for all SaaS tables.
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Security Implications:
  - Re-applies public access policies for SaaS tables to allow the application to function without full Supabase Auth integration yet.
*/

-- 1. Enable RLS on tables (Safe to run multiple times)
ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_token_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_financial_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Allow public read access to plans" ON public.saas_plans;
DROP POLICY IF EXISTS "Allow public read access to settings" ON public.saas_settings;
DROP POLICY IF EXISTS "Allow public read access to packages" ON public.token_packages;

DROP POLICY IF EXISTS "Allow public read access to tenants" ON public.tenants;
DROP POLICY IF EXISTS "Allow public insert to tenants" ON public.tenants;
DROP POLICY IF EXISTS "Allow public update to tenants" ON public.tenants;

DROP POLICY IF EXISTS "Allow public read access to ledger" ON public.saas_token_ledger;
DROP POLICY IF EXISTS "Allow public insert to ledger" ON public.saas_token_ledger;

DROP POLICY IF EXISTS "Allow public read access to transactions" ON public.saas_financial_transactions;
DROP POLICY IF EXISTS "Allow public insert to transactions" ON public.saas_financial_transactions;

-- 3. Re-create policies

-- Plans: Read-only for everyone
CREATE POLICY "Allow public read access to plans" ON public.saas_plans FOR SELECT USING (true);

-- Settings: Read-only for everyone (contains public platform info)
CREATE POLICY "Allow public read access to settings" ON public.saas_settings FOR SELECT USING (true);

-- Packages: Read-only for everyone
CREATE POLICY "Allow public read access to packages" ON public.token_packages FOR SELECT USING (true);

-- Tenants: Public read (login check), insert (register), update (sync settings/sub)
CREATE POLICY "Allow public read access to tenants" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "Allow public insert to tenants" ON public.tenants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to tenants" ON public.tenants FOR UPDATE USING (true);

-- Ledger: Public read (admin), insert (usage tracking)
CREATE POLICY "Allow public read access to ledger" ON public.saas_token_ledger FOR SELECT USING (true);
CREATE POLICY "Allow public insert to ledger" ON public.saas_token_ledger FOR INSERT WITH CHECK (true);

-- Financial: Public read, insert
CREATE POLICY "Allow public read access to transactions" ON public.saas_financial_transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert to transactions" ON public.saas_financial_transactions FOR INSERT WITH CHECK (true);
