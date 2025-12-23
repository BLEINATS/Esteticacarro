-- Super Admin Tables Migration

-- 1. SaaS Settings (Singleton)
CREATE TABLE IF NOT EXISTS saas_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  platform_name TEXT DEFAULT 'Cristal Care ERP',
  support_email TEXT DEFAULT 'suporte@cristalcare.com',
  payment_gateway TEXT DEFAULT 'asaas',
  pix_key TEXT DEFAULT '',
  api_key TEXT DEFAULT '',
  admin_password TEXT DEFAULT 'admin123',
  whatsapp_global JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT single_row CHECK (id = 1)
);

-- 2. SaaS Plans
CREATE TABLE IF NOT EXISTS saas_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  included_tokens INTEGER DEFAULT 0,
  max_employees INTEGER DEFAULT 0,
  max_disk_space INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  highlight BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Token Packages
CREATE TABLE IF NOT EXISTS token_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tokens INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Token Ledger (History of token usage/purchase)
CREATE TABLE IF NOT EXISTS saas_token_ledger (
  id TEXT PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  tenant_name TEXT,
  type TEXT NOT NULL, -- purchase, usage, bonus, plan_credit
  amount INTEGER NOT NULL,
  value NUMERIC DEFAULT 0,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. SaaS Financial Transactions (Manual entries)
CREATE TABLE IF NOT EXISTS saas_financial_transactions (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- income, expense
  category TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SEED INITIAL DATA

-- Settings
INSERT INTO saas_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Plans
INSERT INTO saas_plans (id, name, price, features, included_tokens, max_employees, max_disk_space, active, highlight)
VALUES 
('starter', 'Básico', 62.00, '["Agenda & OS Digital", "Gestão de Clientes", "Controle de Estoque Básico"]'::jsonb, 50, 2, 5, true, false),
('pro', 'Intermediário', 107.00, '["Financeiro Completo", "Gamificação & Fidelidade", "Página Web da Loja", "Comissões Automáticas"]'::jsonb, 500, 6, 20, true, true),
('enterprise', 'Avançado', 206.00, '["Social Studio AI", "Automação de Marketing", "Múltiplas Unidades", "Suporte Prioritário"]'::jsonb, 2000, 999, 100, true, false)
ON CONFLICT (id) DO NOTHING;

-- Token Packages
INSERT INTO token_packages (id, name, tokens, price, active)
VALUES
('pack-100', 'Pacote Start', 100, 29.90, true),
('pack-500', 'Pacote Growth', 500, 99.90, true),
('pack-1000', 'Pacote Scale', 1000, 149.90, true),
('pack-5000', 'Pacote Enterprise', 5000, 499.90, true)
ON CONFLICT (id) DO NOTHING;
