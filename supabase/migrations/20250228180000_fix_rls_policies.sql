-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fidelity_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR TENANTS (The Root Table)
-- Users can view their own tenant
CREATE POLICY "Users can view their own tenant" 
ON tenants FOR SELECT 
USING (auth.uid() = owner_id);

-- Users can insert their own tenant (Critical for registration)
CREATE POLICY "Users can insert their own tenant" 
ON tenants FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Users can update their own tenant
CREATE POLICY "Users can update their own tenant" 
ON tenants FOR UPDATE 
USING (auth.uid() = owner_id);

-- POLICIES FOR OTHER TABLES (Linked by tenant_id)
-- We use a subquery to check if the tenant_id belongs to a tenant owned by the current user

-- CLIENTS
CREATE POLICY "Users can view clients of their tenant" ON clients FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can insert clients to their tenant" ON clients FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can update clients of their tenant" ON clients FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can delete clients of their tenant" ON clients FOR DELETE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- VEHICLES
CREATE POLICY "Users can view vehicles" ON vehicles FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can insert vehicles" ON vehicles FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can update vehicles" ON vehicles FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can delete vehicles" ON vehicles FOR DELETE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- WORK ORDERS
CREATE POLICY "Users can view work_orders" ON work_orders FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can insert work_orders" ON work_orders FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can update work_orders" ON work_orders FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can delete work_orders" ON work_orders FOR DELETE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- INVENTORY
CREATE POLICY "Users can view inventory" ON inventory FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can insert inventory" ON inventory FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can update inventory" ON inventory FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can delete inventory" ON inventory FOR DELETE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- SERVICES
CREATE POLICY "Users can view services" ON services FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can insert services" ON services FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can update services" ON services FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can delete services" ON services FOR DELETE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- EMPLOYEES
CREATE POLICY "Users can view employees" ON employees FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can insert employees" ON employees FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can update employees" ON employees FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can delete employees" ON employees FOR DELETE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- FINANCIAL TRANSACTIONS
CREATE POLICY "Users can view financials" ON financial_transactions FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can insert financials" ON financial_transactions FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can update financials" ON financial_transactions FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can delete financials" ON financial_transactions FOR DELETE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- REWARDS
CREATE POLICY "Users can view rewards" ON rewards FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can insert rewards" ON rewards FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can update rewards" ON rewards FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can delete rewards" ON rewards FOR DELETE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- REDEMPTIONS
CREATE POLICY "Users can view redemptions" ON redemptions FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can insert redemptions" ON redemptions FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can update redemptions" ON redemptions FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- FIDELITY CARDS
CREATE POLICY "Users can view fidelity_cards" ON fidelity_cards FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can insert fidelity_cards" ON fidelity_cards FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can update fidelity_cards" ON fidelity_cards FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- POINTS HISTORY
CREATE POLICY "Users can view points_history" ON points_history FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Users can insert points_history" ON points_history FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
