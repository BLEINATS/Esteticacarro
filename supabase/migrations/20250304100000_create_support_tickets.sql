-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID, -- Optional link to specific user
    user_name TEXT, -- Snapshot of user name
    type TEXT NOT NULL CHECK (type IN ('bug', 'help', 'feature', 'other')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    admin_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Policies
-- Tenants can view their own tickets
CREATE POLICY "Tenants can view own tickets" ON public.support_tickets
    FOR SELECT
    USING (tenant_id = (select auth.uid() from public.tenants where owner_id = auth.uid()));

-- Tenants can insert their own tickets
CREATE POLICY "Tenants can create tickets" ON public.support_tickets
    FOR INSERT
    WITH CHECK (tenant_id IS NOT NULL);

-- Super Admins (service_role or specific admin check) would have full access (handled via dashboard logic usually)
