-- Create marketing_campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  target_segment text NOT NULL,
  message_template text,
  sent_count integer DEFAULT 0,
  conversion_count integer DEFAULT 0,
  revenue_generated numeric DEFAULT 0,
  cost_in_tokens integer DEFAULT 0,
  status text DEFAULT 'draft',
  date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own marketing campaigns"
  ON marketing_campaigns FOR SELECT
  USING (auth.uid() = (SELECT owner_id FROM tenants WHERE id = marketing_campaigns.tenant_id));

CREATE POLICY "Users can insert their own marketing campaigns"
  ON marketing_campaigns FOR INSERT
  WITH CHECK (auth.uid() = (SELECT owner_id FROM tenants WHERE id = marketing_campaigns.tenant_id));

CREATE POLICY "Users can update their own marketing campaigns"
  ON marketing_campaigns FOR UPDATE
  USING (auth.uid() = (SELECT owner_id FROM tenants WHERE id = marketing_campaigns.tenant_id));

CREATE POLICY "Users can delete their own marketing campaigns"
  ON marketing_campaigns FOR DELETE
  USING (auth.uid() = (SELECT owner_id FROM tenants WHERE id = marketing_campaigns.tenant_id));
