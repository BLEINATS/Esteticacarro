/*
  # Create Missing Tables
  Creates tables that exist in the local app but were missing in Supabase:
  - reminders
  - employee_transactions
  - message_logs
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. REMINDERS TABLE
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    service_type TEXT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    auto_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EMPLOYEE TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.employee_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'commission', 'advance', 'salary', 'payment'
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    date TIMESTAMPTZ NOT NULL,
    related_work_order_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MESSAGE LOGS TABLE
CREATE TABLE IF NOT EXISTS public.message_logs (
    id TEXT PRIMARY KEY, -- External ID (e.g., wamid)
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name TEXT,
    client_phone TEXT,
    type TEXT DEFAULT 'text',
    content TEXT,
    status TEXT DEFAULT 'pending',
    cost_in_tokens NUMERIC(10,2) DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    channel TEXT,
    trigger TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENABLE RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- 5. CREATE POLICIES (Permissive for now to match current auth flow)
-- Reminders
CREATE POLICY "Allow public read access to reminders" ON public.reminders FOR SELECT USING (true);
CREATE POLICY "Allow public insert to reminders" ON public.reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to reminders" ON public.reminders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to reminders" ON public.reminders FOR DELETE USING (true);

-- Employee Transactions
CREATE POLICY "Allow public read access to employee_transactions" ON public.employee_transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert to employee_transactions" ON public.employee_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to employee_transactions" ON public.employee_transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to employee_transactions" ON public.employee_transactions FOR DELETE USING (true);

-- Message Logs
CREATE POLICY "Allow public read access to message_logs" ON public.message_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert to message_logs" ON public.message_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to message_logs" ON public.message_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to message_logs" ON public.message_logs FOR DELETE USING (true);
