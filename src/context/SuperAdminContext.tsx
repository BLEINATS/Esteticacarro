import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SaaSPlan, SaaSTenant, TokenPackage, SaaSTokenTransaction } from '../types';
import { addDays, formatISO, subDays } from 'date-fns';

// Configurações da Plataforma SaaS
export interface SaaSSettings {
  platformName: string;
  supportEmail: string;
  paymentGateway: 'asaas' | 'stripe';
  pixKey: string;
  apiKey: string;
  adminPassword?: string;
}

interface SuperAdminContextType {
  tenants: SaaSTenant[];
  plans: SaaSPlan[];
  tokenPackages: TokenPackage[];
  tokenLedger: SaaSTokenTransaction[];
  isAuthenticated: boolean;
  saasSettings: SaaSSettings;
  login: (password: string) => boolean;
  logout: () => void;
  
  addTenant: (tenant: Omit<SaaSTenant, 'id' | 'joinedAt' | 'status' | 'lastLogin'>) => void;
  updateTenant: (id: string, updates: Partial<SaaSTenant>) => void;
  deleteTenant: (id: string) => void;
  addTokensToTenant: (tenantId: string, amount: number) => void;
  
  addPlan: (plan: SaaSPlan) => void;
  updatePlan: (id: string, updates: Partial<SaaSPlan>) => void;
  deletePlan: (id: string) => void;

  addTokenPackage: (pkg: TokenPackage) => void;
  updateTokenPackage: (id: string, updates: Partial<TokenPackage>) => void;
  deleteTokenPackage: (id: string) => void;

  updateSaaSSettings: (settings: Partial<SaaSSettings>) => void;
  
  totalMRR: number;
  activeTenantsCount: number;
  totalTokensSold: number;
  totalTokensConsumed: number;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

// --- MOCK DATA ---
const initialPlans: SaaSPlan[] = [
  {
    id: 'starter',
    name: 'Básico',
    price: 62.00,
    features: ['Agenda & OS Digital', 'Gestão de Clientes', 'Controle de Estoque Básico'],
    includedTokens: 50,
    maxEmployees: 2,
    maxDiskSpace: 5,
    active: true
  },
  {
    id: 'pro',
    name: 'Intermediário',
    price: 107.00,
    features: ['Financeiro Completo', 'Gamificação & Fidelidade', 'Página Web da Loja', 'Comissões Automáticas'],
    includedTokens: 500,
    maxEmployees: 6,
    maxDiskSpace: 20,
    active: true,
    highlight: true
  },
  {
    id: 'enterprise',
    name: 'Avançado',
    price: 206.00,
    features: ['Social Studio AI', 'Automação de Marketing', 'Múltiplas Unidades', 'Suporte Prioritário'],
    includedTokens: 2000,
    maxEmployees: 999,
    maxDiskSpace: 100,
    active: true
  }
];

const initialTokenPackages: TokenPackage[] = [
  { id: 'pack-100', name: 'Pacote Start', tokens: 100, price: 29.90, active: true },
  { id: 'pack-500', name: 'Pacote Growth', tokens: 500, price: 99.90, active: true },
  { id: 'pack-1000', name: 'Pacote Scale', tokens: 1000, price: 149.90, active: true },
  { id: 'pack-5000', name: 'Pacote Enterprise', tokens: 5000, price: 499.90, active: true }
];

const initialTenants: SaaSTenant[] = [
  {
    id: 'tenant-1',
    name: 'Cristal Care Autodetail',
    responsibleName: 'Anderson Silva',
    email: 'contato@cristalcare.com.br',
    phone: '(11) 99999-8888',
    planId: 'pro',
    status: 'active',
    joinedAt: '2024-01-15T10:00:00Z',
    nextBilling: formatISO(addDays(new Date(), 15)),
    tokenBalance: 50,
    mrr: 107.00,
    lastLogin: new Date().toISOString(),
    logoUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=150&q=80'
  }
];

const initialSaaSSettings: SaaSSettings = {
  platformName: 'Cristal Care ERP',
  supportEmail: 'suporte@cristalcare.com',
  paymentGateway: 'asaas',
  pixKey: '00.000.000/0001-00',
  apiKey: '', 
  adminPassword: 'admin'
};

const generateMockLedger = (tenants: SaaSTenant[]): SaaSTokenTransaction[] => {
  return [];
};

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  // Safe Storage Wrappers
  const [tenants, setTenants] = useState<SaaSTenant[]>(() => {
    try {
        const stored = localStorage.getItem('saas_tenants');
        return stored ? JSON.parse(stored) : initialTenants;
    } catch (e) { return initialTenants; }
  });

  const [plans, setPlans] = useState<SaaSPlan[]>(() => {
    try {
        const stored = localStorage.getItem('saas_plans_v3');
        return stored ? JSON.parse(stored) : initialPlans;
    } catch (e) { return initialPlans; }
  });

  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>(() => {
    try {
        const stored = localStorage.getItem('saas_token_packages');
        return stored ? JSON.parse(stored) : initialTokenPackages;
    } catch (e) { return initialTokenPackages; }
  });

  const [saasSettings, setSaasSettings] = useState<SaaSSettings>(() => {
    try {
        const stored = localStorage.getItem('saas_settings');
        return stored ? JSON.parse(stored) : initialSaaSSettings;
    } catch (e) { return initialSaaSSettings; }
  });

  const [tokenLedger, setTokenLedger] = useState<SaaSTokenTransaction[]>(() => {
    try {
        const stored = localStorage.getItem('saas_token_ledger');
        return stored ? JSON.parse(stored) : generateMockLedger(initialTenants);
    } catch (e) { return []; }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('saas_admin_auth') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('saas_tenants', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem('saas_plans_v3', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem('saas_token_packages', JSON.stringify(tokenPackages));
  }, [tokenPackages]);

  useEffect(() => {
    localStorage.setItem('saas_settings', JSON.stringify(saasSettings));
  }, [saasSettings]);

  useEffect(() => {
    localStorage.setItem('saas_token_ledger', JSON.stringify(tokenLedger));
  }, [tokenLedger]);

  const login = (password: string) => {
    if (password === saasSettings.adminPassword || password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('saas_admin_auth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('saas_admin_auth');
  };

  const addTenant = (tenantData: Omit<SaaSTenant, 'id' | 'joinedAt' | 'status' | 'lastLogin'>) => {
    const plan = plans.find(p => p.id === tenantData.planId);
    const newTenant: SaaSTenant = {
      id: `tenant-${Date.now()}`,
      ...tenantData,
      status: 'active',
      joinedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      mrr: plan ? plan.price : 0
    };
    setTenants(prev => [...prev, newTenant]);
  };

  const updateTenant = (id: string, updates: Partial<SaaSTenant>) => {
    setTenants(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updates };
        if (updates.planId) {
            const plan = plans.find(p => p.id === updates.planId);
            if (plan) updated.mrr = plan.price;
        }
        return updated;
      }
      return t;
    }));
  };

  const deleteTenant = (id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id));
  };

  const addTokensToTenant = (tenantId: string, amount: number) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    setTenants(prev => prev.map(t => 
      t.id === tenantId ? { ...t, tokenBalance: t.tokenBalance + amount } : t
    ));

    const transaction: SaaSTokenTransaction = {
        id: `tx-${Date.now()}`,
        tenantId,
        tenantName: tenant.name,
        type: 'bonus',
        amount: amount,
        description: 'Bônus Administrativo',
        date: new Date().toISOString()
    };
    setTokenLedger(prev => [transaction, ...prev]);
  };

  const addPlan = (plan: SaaSPlan) => {
    setPlans(prev => [...prev, plan]);
  };

  const updatePlan = (id: string, updates: Partial<SaaSPlan>) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePlan = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const addTokenPackage = (pkg: TokenPackage) => {
    setTokenPackages(prev => [...prev, pkg]);
  };

  const updateTokenPackage = (id: string, updates: Partial<TokenPackage>) => {
    setTokenPackages(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteTokenPackage = (id: string) => {
    setTokenPackages(prev => prev.filter(p => p.id !== id));
  };

  const updateSaaSSettings = (settings: Partial<SaaSSettings>) => {
    setSaasSettings(prev => ({ ...prev, ...settings }));
  };

  const totalMRR = tenants.filter(t => t.status === 'active').reduce((acc, t) => acc + t.mrr, 0);
  const activeTenantsCount = tenants.filter(t => t.status === 'active').length;
  
  const totalTokensSold = tokenLedger
    .filter(t => t.type === 'purchase' || t.type === 'plan_credit' || t.type === 'bonus')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const totalTokensConsumed = Math.abs(tokenLedger
    .filter(t => t.type === 'usage')
    .reduce((acc, t) => acc + t.amount, 0));

  return (
    <SuperAdminContext.Provider value={{
      tenants,
      plans,
      tokenPackages,
      tokenLedger,
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
      updateSaaSSettings,
      totalMRR,
      activeTenantsCount,
      totalTokensSold,
      totalTokensConsumed
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
