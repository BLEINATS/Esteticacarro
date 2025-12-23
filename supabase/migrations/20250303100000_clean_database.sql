/*
  # Factory Reset - Clean All Data
  
  ## Query Description: 
  Esta operação irá APAGAR TODOS OS DADOS de todas as tabelas do sistema.
  Use isso apenas quando quiser reiniciar o sistema do zero (ambiente de desenvolvimento).
  
  ## Metadata:
  - Schema-Category: Dangerous
  - Impact-Level: High
  - Requires-Backup: false (Dev only)
  - Reversible: No
  
  ## Structure Details:
  - Truncates all public tables with CASCADE to handle foreign keys.
*/

TRUNCATE TABLE 
  public.tenants,
  public.clients,
  public.work_orders,
  public.inventory,
  public.services,
  public.employees,
  public.financial_transactions,
  public.rewards,
  public.marketing_campaigns,
  public.alerts,
  public.reminders,
  public.employee_transactions,
  public.message_logs,
  public.fidelity_cards,
  public.points_history,
  public.redemptions,
  public.service_consumptions,
  public.vehicles,
  public.saas_financial_transactions,
  public.saas_token_ledger
CASCADE;

-- Opcional: Reinserir configurações padrão do SaaS se necessário
-- INSERT INTO public.saas_settings ...
