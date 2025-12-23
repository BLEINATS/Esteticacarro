-- Clean up potential conflicts and the 'todos' table causing the error
DROP TABLE IF EXISTS todos;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    owner_id UUID NOT NULL,
    plan_id TEXT DEFAULT 'trial',
    status TEXT DEFAULT 'active',
    settings JSONB DEFAULT '{}'::jsonb,
    subscription JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address_data JSONB DEFAULT '{}'::jsonb,
    ltv NUMERIC DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active',
    segment TEXT DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    plate TEXT NOT NULL,
    color TEXT,
    year TEXT,
    size TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
    id TEXT PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    client_id UUID REFERENCES clients(id),
    vehicle_plate TEXT,
    service_summary TEXT,
    status TEXT,
    total_value NUMERIC,
    technician TEXT,
    deadline TEXT,
    payment_status TEXT DEFAULT 'pending',
    payment_method TEXT,
    nps_score INTEGER,
    json_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    name TEXT NOT NULL,
    category TEXT,
    stock NUMERIC DEFAULT 0,
    unit TEXT,
    min_stock NUMERIC DEFAULT 0,
    cost_price NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'ok',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Financial Transactions
CREATE TABLE IF NOT EXISTS financial_transactions (
    id BIGINT PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    description TEXT,
    category TEXT,
    amount NUMERIC,
    type TEXT,
    date TEXT,
    method TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Services
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    standard_time INTEGER,
    active BOOLEAN DEFAULT true,
    price_matrix JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    name TEXT NOT NULL,
    role TEXT,
    pin TEXT,
    salary_data JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Rewards
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    name TEXT NOT NULL,
    description TEXT,
    required_points INTEGER DEFAULT 0,
    required_level TEXT,
    reward_type TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Redemptions
CREATE TABLE IF NOT EXISTS redemptions (
    id TEXT PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    client_id UUID REFERENCES clients(id),
    reward_id UUID REFERENCES rewards(id),
    reward_name TEXT,
    code TEXT,
    points_cost INTEGER,
    status TEXT,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Fidelity Cards
CREATE TABLE IF NOT EXISTS fidelity_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    client_id UUID REFERENCES clients(id),
    card_number TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Points History
CREATE TABLE IF NOT EXISTS points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    client_id UUID REFERENCES clients(id),
    points INTEGER,
    description TEXT,
    type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
