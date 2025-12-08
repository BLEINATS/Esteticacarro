-- -----------------------------------------------------------------------------
-- SCHEMA SQL PARA CRISTAL CARE ERP (SUPABASE)
-- Copie e cole este código no "SQL Editor" do seu projeto Supabase.
-- -----------------------------------------------------------------------------

-- 1. Tabela de Tenants (Lojas/Oficinas)
create table public.tenants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  owner_email text not null,
  plan_id text default 'starter',
  status text default 'active',
  phone text,
  address text,
  logo_url text,
  created_at timestamptz default now()
);

-- 2. Tabela de Clientes
create table public.clients (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  phone text not null,
  email text,
  address text,
  notes text,
  ltv numeric default 0,
  visit_count integer default 0,
  last_visit timestamptz,
  status text default 'active',
  created_at timestamptz default now()
);

-- 3. Tabela de Veículos
create table public.vehicles (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  model text not null,
  plate text not null,
  color text,
  year text,
  size text default 'medium',
  created_at timestamptz default now()
);

-- 4. Tabela de Ordens de Serviço (OS)
create table public.work_orders (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  vehicle_plate text,
  service_summary text,
  status text default 'Aguardando',
  total_value numeric default 0,
  technician text,
  deadline text,
  payment_status text default 'pending',
  payment_method text,
  nps_score integer,
  json_data jsonb default '{}'::jsonb, -- Guarda arrays complexos (avarias, checklist)
  created_at timestamptz default now()
);

-- 5. Tabela Financeira
create table public.financial_transactions (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  description text not null,
  category text not null,
  amount numeric not null,
  type text check (type in ('income', 'expense')),
  date date not null,
  method text,
  status text default 'paid',
  created_at timestamptz default now()
);

-- 6. Habilitar RLS (Row Level Security)
-- Isso garante que uma loja não veja os dados da outra.
alter table public.tenants enable row level security;
alter table public.clients enable row level security;
alter table public.vehicles enable row level security;
alter table public.work_orders enable row level security;
alter table public.financial_transactions enable row level security;

-- 7. Políticas de Segurança (Simplificado para MVP)
-- Na prática, você vincularia o auth.uid() ao tenant_id.
-- Por enquanto, criamos uma política que permite acesso se o usuário estiver autenticado.

create policy "Tenants can view their own data" on public.tenants
  for all using (auth.uid() is not null); -- Refinar depois para checar owner_id

create policy "Users can view clients of their tenant" on public.clients
  for all using (auth.uid() is not null);

create policy "Users can view vehicles of their tenant" on public.vehicles
  for all using (auth.uid() is not null);

create policy "Users can view work orders of their tenant" on public.work_orders
  for all using (auth.uid() is not null);

create policy "Users can view finance of their tenant" on public.financial_transactions
  for all using (auth.uid() is not null);

-- FIM DO SCRIPT
