/*
  # Ensure All Tables Exist & Apply RLS
  
  This migration fixes the "relation does not exist" error by ensuring all core tables 
  are created before attempting to apply security policies.
  
  1. Creates tables if they don't exist:
     - users, tenants
     - clients, vehicles, work_orders
     - inventory, services, employees
     - financial_transactions, employee_transactions
     - rewards, redemptions, fidelity_cards, points_history
     - marketing_campaigns, message_logs, alerts, reminders
     - saas_plans, saas_settings, token_packages, saas_token_ledger, saas_financial_transactions
  
  2. Enables RLS on all tables
  3. Creates permissive policies for public access (since we use local auth)
*/

-- 1. CORE TABLES (Users & Tenants)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    name TEXT,
    email TEXT,
    password TEXT,
    "shopName" TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY,
    name TEXT,
    slug TEXT,
    owner_id UUID, -- References users.id logically
    plan_id TEXT,
    status TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    subscription JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CRM TABLES
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY,
    tenant_id UUID,
    name TEXT,
    phone TEXT,
    email TEXT,
    address_data JSONB,
    ltv NUMERIC DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    last_visit TIMESTAMPTZ,
    status TEXT,
    segment TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY,
    tenant_id UUID,
    client_id UUID,
    model TEXT,
    plate TEXT,
    color TEXT,
    year TEXT,
    size TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. OPERATIONS TABLES
CREATE TABLE IF NOT EXISTS public.work_orders (
    id TEXT PRIMARY KEY, -- Using TEXT ID as per app logic (OS-XXXX)
    tenant_id UUID,
    client_id UUID,
    vehicle_plate TEXT,
    service_summary TEXT,
    status TEXT,
    total_value NUMERIC DEFAULT 0,
    technician TEXT,
    deadline TEXT,
    payment_status TEXT,
    payment_method TEXT,
    nps_score INTEGER,
    json_data JSONB, -- Stores full object for flexibility
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    tenant_id UUID,
    name TEXT,
    category TEXT,
    description TEXT,
    standard_time INTEGER,
    active BOOLEAN DEFAULT true,
    price_matrix JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory (
    id SERIAL PRIMARY KEY,
    tenant_id UUID,
    name TEXT,
    category TEXT,
    stock NUMERIC DEFAULT 0,
    unit TEXT,
    min_stock NUMERIC DEFAULT 0,
    cost_price NUMERIC DEFAULT 0,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TEAM & FINANCE
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    tenant_id UUID,
    name TEXT,
    role TEXT,
    pin TEXT,
    salary_data JSONB,
    active BOOLEAN DEFAULT true,
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id BIGINT PRIMARY KEY, -- Using timestamp as ID from app
    tenant_id UUID,
    description TEXT,
    category TEXT,
    amount NUMERIC,
    type TEXT,
    date TIMESTAMPTZ,
    method TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employee_transactions (
    id TEXT PRIMARY KEY,
    tenant_id UUID,
    employee_id TEXT,
    type TEXT,
    amount NUMERIC,
    description TEXT,
    date TIMESTAMPTZ,
    related_work_order_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. GAMIFICATION & MARKETING
CREATE TABLE IF NOT EXISTS public.rewards (
    id TEXT PRIMARY KEY,
    tenant_id UUID,
    name TEXT,
    description TEXT,
    required_points INTEGER,
    required_level TEXT,
    reward_type TEXT,
    config JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.redemptions (
    id TEXT PRIMARY KEY,
    tenant_id UUID,
    client_id UUID,
    reward_id TEXT,
    reward_name TEXT,
    code TEXT,
    points_cost INTEGER,
    status TEXT,
    redeemed_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.fidelity_cards (
    id TEXT PRIMARY KEY,
    tenant_id UUID,
    client_id UUID,
    card_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.points_history (
    id TEXT PRIMARY KEY,
    tenant_id UUID,
    client_id UUID,
    points INTEGER,
    description TEXT,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id TEXT PRIMARY KEY,
    tenant_id UUID,
    name TEXT,
    target_segment TEXT,
    message_template TEXT,
    sent_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    revenue_generated NUMERIC DEFAULT 0,
    cost_in_tokens INTEGER DEFAULT 0,
    status TEXT,
    date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.message_logs (
    id TEXT PRIMARY KEY,
    tenant_id UUID,
    client_id UUID,
    client_name TEXT,
    client_phone TEXT,
    type TEXT,
    content TEXT,
    status TEXT,
    cost_in_tokens INTEGER DEFAULT 0,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    channel TEXT,
    trigger TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SYSTEM UTILS
CREATE TABLE IF NOT EXISTS public.alerts (
    id TEXT PRIMARY KEY,
    tenant_id UUID,
    type TEXT,
    message TEXT,
    level TEXT,
    action_link TEXT,
    action_label TEXT,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reminders (
    id TEXT PRIMARY KEY,
    tenant_id UUID,
    client_id UUID,
    vehicle_id UUID,
    service_type TEXT,
    due_date TIMESTAMPTZ,
    status TEXT,
    auto_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUPER ADMIN TABLES
CREATE TABLE IF NOT EXISTS public.saas_plans (
    id TEXT PRIMARY KEY,
    name TEXT,
    price NUMERIC,
    features JSONB,
    included_tokens INTEGER,
    max_employees INTEGER,
    max_disk_space INTEGER,
    active BOOLEAN DEFAULT true,
    highlight BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.saas_settings (
    id SERIAL PRIMARY KEY,
    platform_name TEXT,
    support_email TEXT,
    payment_gateway TEXT,
    pix_key TEXT,
    api_key TEXT,
    admin_password TEXT,
    whatsapp_global JSONB
);

CREATE TABLE IF NOT EXISTS public.token_packages (
    id TEXT PRIMARY KEY,
    name TEXT,
    tokens INTEGER,
    price NUMERIC,
    active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.saas_token_ledger (
    id SERIAL PRIMARY KEY,
    tenant_id UUID,
    tenant_name TEXT,
    type TEXT,
    amount INTEGER,
    value NUMERIC,
    description TEXT,
    date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saas_financial_transactions (
    id TEXT PRIMARY KEY,
    description TEXT,
    amount NUMERIC,
    type TEXT,
    category TEXT,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ENABLE RLS & CREATE POLICIES
-- ==========================================

DO $$ 
DECLARE 
    tbl text; 
BEGIN 
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    LOOP 
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl); 
        
        -- Drop existing policies to avoid conflicts
        EXECUTE format('DROP POLICY IF EXISTS "Enable all access for public" ON public.%I;', tbl);
        
        -- Create permissive policy
        EXECUTE format('CREATE POLICY "Enable all access for public" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl); 
    END LOOP; 
END $$;
