-- Tabela de Alertas de Gestão
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'agenda', 'financeiro', 'cliente', 'profissional'
  message TEXT NOT NULL,
  level TEXT NOT NULL, -- 'info', 'atencao', 'critico'
  action_link TEXT, -- Link interno para ação rápida (ex: '/clients')
  action_label TEXT, -- Texto do botão (ex: 'Ver Clientes')
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas de Segurança (RLS) para Alertas
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts" ON alerts
  FOR SELECT USING (auth.uid() IN (SELECT owner_id FROM tenants WHERE id = alerts.tenant_id));

CREATE POLICY "Users can insert their own alerts" ON alerts
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT owner_id FROM tenants WHERE id = alerts.tenant_id));

CREATE POLICY "Users can update their own alerts" ON alerts
  FOR UPDATE USING (auth.uid() IN (SELECT owner_id FROM tenants WHERE id = alerts.tenant_id));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_alerts_tenant_created ON alerts(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
