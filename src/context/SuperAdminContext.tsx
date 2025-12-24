import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SaaSPlan, SaaSTenant, TokenPackage, SaaSTokenTransaction, SaaSTransaction } from '../types';
import { supabase } from '../lib/supabase';
import { syncProductToStripe } from '../services/stripe';

// Configurações da Plataforma SaaS
export interface SaaSSettings {
  platformName: string;
  supportEmail: string;
  paymentGateway: 'asaas' | 'stripe';
  pixKey: string;
  apiKey: string;
  adminPassword?: string;
  whatsappGlobal?: {
    enabled: boolean;
    baseUrl: string;
    apiKey: string;
    webhookUrl?: string;
  };
}

interface SuperAdminContextType {
  tenants: SaaSTenant[];
  plans: SaaSPlan[];
  tokenPackages: TokenPackage[];
  tokenLedger: SaaSTokenTransaction[];
  saasTransactions: SaaSTransaction[];
  isAuthenticated: boolean;
  saasSettings: SaaSSettings;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  
  addTenant: (tenant: Omit<SaaSTenant, 'id' | 'joinedAt' | 'status' | 'lastLogin'>) => Promise<void>;
  updateTenant: (id: string, updates: Partial<SaaSTenant>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  addTokensToTenant: (tenantId: string, amount: number) => Promise<void>;
  
  addPlan: (plan: SaaSPlan) => Promise<void>;
  updatePlan: (id: string, updates: Partial<SaaSPlan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;

  addTokenPackage: (pkg: TokenPackage) => Promise<void>;
  updateTokenPackage: (id: string, updates: Partial<TokenPackage>) => Promise<void>;
  deleteTokenPackage: (id: string) => Promise<void>;

  addSaaSTransaction: (transaction: SaaSTransaction) => Promise<void>;
  deleteSaaSTransaction: (id: string) => Promise<void>;

  updateSaaSSettings: (settings: Partial<SaaSSettings>) => Promise<void>;
  
  totalMRR: number;
  activeTenantsCount: number;
  totalTokensSold: number;
  totalTokensConsumed: number;
  
  financialMetrics: {
      revenue: number;
      expenses: number;
      profit: number;
      margin: number;
  };
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

const initialSaaSSettings: SaaSSettings = {
  platformName: 'Cristal Care ERP',
  supportEmail: 'suporte@cristalcare.com',
  paymentGateway: 'asaas',
  pixKey: '',
  apiKey: '', 
  adminPassword: 'admin',
  whatsappGlobal: {
    enabled: false,
    baseUrl: 'https://w-api.app/api',
    apiKey: '',
    webhookUrl: ''
  }
};

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<SaaSTenant[]>([]);
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([]);
  const [saasSettings, setSaasSettings] = useState<SaaSSettings>(initialSaaSSettings);
  const [tokenLedger, setTokenLedger] = useState<SaaSTokenTransaction[]>([]);
  const [saasTransactions, setSaasTransactions] = useState<SaaSTransaction[]>([]);
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('saas_admin_auth') === 'true';
  });

  // --- DATA LOADING ---
  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    } else {
      // Load public data (Plans, Packages, Basic Settings) for Store Owners
      loadPublicData();
    }
  }, [isAuthenticated]);

  const loadPublicData = async () => {
      try {
        // 1. Public Settings (Platform Name, Email, Gateway)
        const { data: settingsData } = await supabase.from('saas_settings').select('platform_name, support_email, payment_gateway').single();
        if (settingsData) {
            setSaasSettings(prev => ({
                ...prev,
                platformName: settingsData.platform_name || prev.platformName,
                supportEmail: settingsData.support_email || prev.supportEmail,
                paymentGateway: (settingsData.payment_gateway as any) || prev.paymentGateway
            }));
        }

        // 2. Plans (Public Read)
        const { data: plansData } = await supabase.from('saas_plans').select('*');
        if (plansData) {
            setPlans(plansData.map(p => ({
                id: p.id as any,
                name: p.name,
                price: p.price,
                features: p.features,
                includedTokens: p.included_tokens,
                maxEmployees: p.max_employees,
                maxDiskSpace: p.max_disk_space,
                active: p.active,
                highlight: p.highlight
            })));
        }

        // 3. Token Packages (Public Read)
        const { data: packagesData } = await supabase.from('token_packages').select('*');
        if (packagesData) {
            setTokenPackages(packagesData);
        }
      } catch (err) {
        console.error("Error loading public data:", err);
      }
  };

  const loadAdminData = async () => {
    try {
      // 1. Settings (Full Access)
      const { data: settingsData } = await supabase.from('saas_settings').select('*').single();
      
      if (settingsData) {
        setSaasSettings({
            platformName: settingsData.platform_name,
            supportEmail: settingsData.support_email,
            paymentGateway: settingsData.payment_gateway as any,
            pixKey: settingsData.pix_key,
            apiKey: settingsData.api_key,
            adminPassword: settingsData.admin_password,
            whatsappGlobal: settingsData.whatsapp_global as any
        });
      } else {
          // Seed default settings if table is empty
          const defaultSettings = {
              platform_name: initialSaaSSettings.platformName,
              support_email: initialSaaSSettings.supportEmail,
              payment_gateway: initialSaaSSettings.paymentGateway,
              admin_password: initialSaaSSettings.adminPassword,
              whatsapp_global: initialSaaSSettings.whatsappGlobal
          };
          await supabase.from('saas_settings').insert(defaultSettings);
      }

      // 2. Plans
      const { data: plansData } = await supabase.from('saas_plans').select('*');
      if (plansData) {
        setPlans(plansData.map(p => ({
            id: p.id as any,
            name: p.name,
            price: p.price,
            features: p.features,
            includedTokens: p.included_tokens,
            maxEmployees: p.max_employees,
            maxDiskSpace: p.max_disk_space,
            active: p.active,
            highlight: p.highlight
        })));
      }

      // 3. Token Packages
      const { data: packagesData } = await supabase.from('token_packages').select('*');
      if (packagesData) {
        setTokenPackages(packagesData);
      }

      // 4. Tenants
      const { data: tenantsData } = await supabase.from('tenants').select('*');
      if (tenantsData) {
        setTenants(tenantsData.map(t => ({
            id: t.id,
            name: t.name,
            responsibleName: (t.settings as any)?.responsibleName || 'Admin',
            email: 'admin@loja.com', 
            phone: (t.settings as any)?.phone || '',
            planId: t.plan_id,
            status: t.status as any,
            joinedAt: t.created_at,
            nextBilling: (t.subscription as any)?.nextBillingDate || new Date().toISOString(),
            tokenBalance: (t.subscription as any)?.tokenBalance || 0,
            mrr: 0, // Calculated later
            lastLogin: t.created_at,
            logoUrl: (t.settings as any)?.logoUrl
        })));
      }

      // 5. Ledger
      const { data: ledgerData } = await supabase.from('saas_token_ledger').select('*').order('date', { ascending: false });
      if (ledgerData) {
        setTokenLedger((ledgerData as any[]).map(l => ({
            id: l.id,
            tenantId: l.tenant_id,
            tenantName: l.tenant_name,
            type: l.type as any,
            amount: l.amount,
            value: l.value,
            description: l.description,
            date: l.date
        })));
      }

      // 6. Transactions
      const { data: transData } = await supabase.from('saas_financial_transactions').select('*').order('date', { ascending: false });
      if (transData) {
        setSaasTransactions(transData as any[]);
      }

    } catch (error) {
      console.error("Error loading Super Admin data:", error);
    }
  };

  // --- ACTIONS ---

  const login = async (password: string) => {
    try {
        // Check against DB settings
        const { data } = await supabase.from('saas_settings').select('admin_password').single();
        const dbPass = data?.admin_password || 'admin123';
        
        if (password === dbPass) {
        setIsAuthenticated(true);
        localStorage.setItem('saas_admin_auth', 'true');
        return true;
        }
    } catch (e) {
        // Fallback if DB fails
        if (password === 'admin123') {
            setIsAuthenticated(true);
            localStorage.setItem('saas_admin_auth', 'true');
            return true;
        }
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('saas_admin_auth');
  };

  const updateSaaSSettings = async (settings: Partial<SaaSSettings>) => {
    setSaasSettings(prev => ({ ...prev, ...settings }));
    
    // Check if row exists first
    const { data } = await supabase.from('saas_settings').select('id').single();
    
    const payload = {
        platform_name: settings.platformName,
        support_email: settings.supportEmail,
        payment_gateway: settings.paymentGateway,
        pix_key: settings.pixKey,
        api_key: settings.apiKey,
        admin_password: settings.adminPassword,
        whatsapp_global: settings.whatsappGlobal
    };

    if (data) {
        await supabase.from('saas_settings').update(payload).eq('id', data.id);
    } else {
        await supabase.from('saas_settings').insert(payload);
    }
  };

  // Tenants
  const addTenant = async (_tenantData: any) => {
      console.log('Use register flow to add tenants');
  };

  const updateTenant = async (id: string, updates: Partial<SaaSTenant>) => {
      setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      
      const payload: any = {};
      if (updates.status) payload.status = updates.status;
      if (updates.planId) payload.plan_id = updates.planId;
      
      if (Object.keys(payload).length > 0) {
          await supabase.from('tenants').update(payload).eq('id', id);
      }
  };

  const deleteTenant = async (id: string) => {
      setTenants(prev => prev.filter(t => t.id !== id));
      await supabase.from('tenants').delete().eq('id', id);
  };

  const addTokensToTenant = async (tenantId: string, amount: number) => {
      const tenant = tenants.find(t => t.id === tenantId);
      if (!tenant) return;

      // Update local state
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, tokenBalance: t.tokenBalance + amount } : t));
      
      // Update DB Tenant
      const { data } = await supabase.from('tenants').select('subscription').eq('id', tenantId).single();
      if (data && data.subscription) {
          const sub = data.subscription as any;
          sub.tokenBalance = (sub.tokenBalance || 0) + amount;
          await supabase.from('tenants').update({ subscription: sub }).eq('id', tenantId);
      }

      // Add to Ledger
      const ledgerEntry = {
          id: `led-${Date.now()}`,
          tenant_id: tenantId,
          tenant_name: tenant.name,
          type: 'bonus',
          amount: amount,
          value: 0,
          description: 'Bônus Administrativo',
          date: new Date().toISOString()
      };
      
      const { data: newLedger } = await supabase.from('saas_token_ledger').insert(ledgerEntry).select().single();
      if (newLedger) {
          setTokenLedger(prev => [{
              id: newLedger.id,
              tenantId: newLedger.tenant_id,
              tenantName: newLedger.tenant_name,
              type: newLedger.type as any,
              amount: newLedger.amount,
              value: newLedger.value,
              description: newLedger.description,
              date: newLedger.date
          }, ...prev]);
      } else {
          // Optimistic update if insert returns nothing (e.g. RLS or network)
          setTokenLedger(prev => [{
              id: ledgerEntry.id,
              tenantId: ledgerEntry.tenant_id,
              tenantName: ledgerEntry.tenant_name,
              type: ledgerEntry.type as any,
              amount: ledgerEntry.amount,
              value: ledgerEntry.value,
              description: ledgerEntry.description,
              date: ledgerEntry.date
          }, ...prev]);
      }
  };

  // Plans
  const addPlan = async (plan: SaaSPlan) => {
      setPlans(prev => [...prev, plan]);
      await supabase.from('saas_plans').insert({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          features: plan.features,
          included_tokens: plan.includedTokens,
          max_employees: plan.maxEmployees,
          max_disk_space: plan.maxDiskSpace,
          active: plan.active,
          highlight: plan.highlight
      });

      // SYNC TO STRIPE (If enabled)
      if (saasSettings.paymentGateway === 'stripe' && saasSettings.apiKey) {
          try {
              await syncProductToStripe(plan.name, plan.price, 'recurring', saasSettings.apiKey);
              console.log(`Plan ${plan.name} synced to Stripe`);
          } catch (e) {
              console.error("Failed to sync plan to Stripe", e);
          }
      }
  };

  const updatePlan = async (id: string, updates: Partial<SaaSPlan>) => {
      setPlans(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      
      const payload: any = {};
      if (updates.name) payload.name = updates.name;
      if (updates.price !== undefined) payload.price = updates.price;
      if (updates.features) payload.features = updates.features;
      if (updates.includedTokens !== undefined) payload.included_tokens = updates.includedTokens;
      if (updates.active !== undefined) payload.active = updates.active;
      
      await supabase.from('saas_plans').update(payload).eq('id', id);

      // SYNC TO STRIPE (If price or name changed)
      if ((updates.name || updates.price) && saasSettings.paymentGateway === 'stripe' && saasSettings.apiKey) {
          const plan = plans.find(p => p.id === id);
          if (plan) {
              try {
                  await syncProductToStripe(updates.name || plan.name, updates.price || plan.price, 'recurring', saasSettings.apiKey);
                  console.log(`Plan ${plan.name} synced update to Stripe`);
              } catch (e) {
                  console.error("Failed to sync plan update to Stripe", e);
              }
          }
      }
  };

  const deletePlan = async (id: string) => {
      setPlans(prev => prev.filter(p => p.id !== id));
      await supabase.from('saas_plans').delete().eq('id', id);
  };

  // Token Packages
  const addTokenPackage = async (pkg: TokenPackage) => {
      setTokenPackages(prev => [...prev, pkg]);
      await supabase.from('token_packages').insert(pkg);

      // SYNC TO STRIPE (If enabled)
      if (saasSettings.paymentGateway === 'stripe' && saasSettings.apiKey) {
          try {
              await syncProductToStripe(pkg.name, pkg.price, 'one_time', saasSettings.apiKey);
              console.log(`Package ${pkg.name} synced to Stripe`);
          } catch (e) {
              console.error("Failed to sync package to Stripe", e);
          }
      }
  };

  const updateTokenPackage = async (id: string, updates: Partial<TokenPackage>) => {
      setTokenPackages(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      await supabase.from('token_packages').update(updates).eq('id', id);
  };

  const deleteTokenPackage = async (id: string) => {
      setTokenPackages(prev => prev.filter(p => p.id !== id));
      await supabase.from('token_packages').delete().eq('id', id);
  };

  // Transactions
  const addSaaSTransaction = async (transaction: SaaSTransaction) => {
      setSaasTransactions(prev => [transaction, ...prev]);
      await supabase.from('saas_financial_transactions').insert(transaction);
  };

  const deleteSaaSTransaction = async (id: string) => {
      setSaasTransactions(prev => prev.filter(t => t.id !== id));
      await supabase.from('saas_financial_transactions').delete().eq('id', id);
  };

  // Metrics Calculations
  const totalMRR = tenants.filter(t => t.status === 'active').reduce((acc, t) => {
      const plan = plans.find(p => p.id === t.planId);
      return acc + (plan ? plan.price : 0);
  }, 0);

  // Update MRR in tenants list for display
  const tenantsWithMRR = tenants.map(t => {
      const plan = plans.find(p => p.id === t.planId);
      return { ...t, mrr: plan ? plan.price : 0 };
  });

  const activeTenantsCount = tenants.filter(t => t.status === 'active').length;
  
  const totalTokensSold = tokenLedger
    .filter(t => t.type === 'purchase' || t.type === 'plan_credit' || t.type === 'bonus')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const totalTokensConsumed = Math.abs(tokenLedger
    .filter(t => t.type === 'usage')
    .reduce((acc, t) => acc + t.amount, 0));

  const tokenSalesRevenue = tokenLedger
    .filter(t => t.type === 'purchase')
    .reduce((acc, t) => acc + (t.value || 0), 0);

  const manualExpenses = saasTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const manualIncome = saasTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalRevenue = totalMRR + tokenSalesRevenue + manualIncome;
  const totalExpenses = manualExpenses;
  const profit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return (
    <SuperAdminContext.Provider value={{
      tenants: tenantsWithMRR,
      plans,
      tokenPackages,
      tokenLedger,
      saasTransactions,
      isAuthenticated,
      saasSettings,
      login,
      logout,
      addTenant,
      updateTenant,
      deleteTenant,
      addTokensToTenant,
      addPlan,
      updatePlan,
      deletePlan,
      addTokenPackage,
      updateTokenPackage,
      deleteTokenPackage,
      addSaaSTransaction,
      deleteSaaSTransaction,
      updateSaaSSettings,
      totalMRR,
      activeTenantsCount,
      totalTokensSold,
      totalTokensConsumed,
      financialMetrics: {
          revenue: totalRevenue,
          expenses: totalExpenses,
          profit,
          margin
      }
    }}>
      {children}
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdmin() {
  const context = useContext(SuperAdminContext);
  if (context === undefined) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
}
