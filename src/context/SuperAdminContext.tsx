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
  tokenLedger: SaaSTokenTransaction[]; // New Ledger
  isAuthenticated: boolean;
  saasSettings: SaaSSettings;
  login: (password: string) => boolean;
  logout: () => void;
  
  // Tenant Actions
  addTenant: (tenant: Omit<SaaSTenant, 'id' | 'joinedAt' | 'status' | 'lastLogin'>) => void;
  updateTenant: (id: string, updates: Partial<SaaSTenant>) => void;
  deleteTenant: (id: string) => void;
  addTokensToTenant: (tenantId: string, amount: number) => void;
  
  // Plan Actions
  addPlan: (plan: SaaSPlan) => void;
  updatePlan: (id: string, updates: Partial<SaaSPlan>) => void;
  deletePlan: (id: string) => void;

  // Token Package Actions
  addTokenPackage: (pkg: TokenPackage) => void;
  updateTokenPackage: (id: string, updates: Partial<TokenPackage>) => void;
  deleteTokenPackage: (id: string) => void;

  // Settings Actions
  updateSaaSSettings: (settings: Partial<SaaSSettings>) => void;
  
  // Metrics
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
  },
  {
    id: 'tenant-2',
    name: 'Lava Rápido do Zé',
    responsibleName: 'José Santos',
    email: 'ze@lavarapido.com',
    phone: '(11) 98888-7777',
    planId: 'starter',
    status: 'active',
    joinedAt: '2024-03-10T14:30:00Z',
    nextBilling: formatISO(addDays(new Date(), 5)),
    tokenBalance: 0,
    mrr: 62.00,
    lastLogin: formatISO(subDays(new Date(), 2))
  },
  {
    id: 'tenant-3',
    name: 'Elite Detail Studio',
    responsibleName: 'Marcos Oliveira',
    email: 'marcos@elitedetail.com',
    phone: '(21) 97777-6666',
    planId: 'enterprise',
    status: 'trial',
    joinedAt: formatISO(subDays(new Date(), 5)),
    nextBilling: formatISO(addDays(new Date(), 25)),
    tokenBalance: 500,
    mrr: 0, // Trial doesn't generate MRR yet
    lastLogin: new Date().toISOString()
  },
  {
    id: 'tenant-4',
    name: 'Brilho Car',
    responsibleName: 'Ana Costa',
    email: 'ana@brilhocar.com',
    phone: '(31) 96666-5555',
    planId: 'starter',
    status: 'suspended', // Inadimplente
    joinedAt: '2023-11-20T09:00:00Z',
    nextBilling: formatISO(subDays(new Date(), 10)), // Overdue
    tokenBalance: 10,
    mrr: 62.00,
    lastLogin: formatISO(subDays(new Date(), 15))
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

// Generate Mock Token Ledger
const generateMockLedger = (tenants: SaaSTenant[]): SaaSTokenTransaction[] => {
  const ledger: SaaSTokenTransaction[] = [];
  const types: ('purchase' | 'usage' | 'plan_credit')[] = ['purchase', 'usage', 'usage', 'usage', 'plan_credit'];
  
  tenants.forEach(tenant => {
    // Generate 5-10 transactions per tenant
    const count = Math.floor(Math.random() * 5) + 5;
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const isCredit = type === 'purchase' || type === 'plan_credit' || type === 'bonus';
      const daysAgo = Math.floor(Math.random() * 30);
      
      let amount = 0;
      let value = 0;
      let description = '';

      if (type === 'purchase') {
        amount = [100, 500, 1000].sort(() => Math.random() - 0.5)[0];
        value = amount === 100 ? 29.90 : amount === 500 ? 99.90 : 149.90;
        description = `Compra Pacote ${amount}`;
      } else if (type === 'plan_credit') {
        amount = 500;
        description = 'Crédito Mensal do Plano';
      } else {
        amount = -Math.floor(Math.random() * 5 + 1); // Usage is small per transaction
        description = 'Envio Campanha WhatsApp';
      }

      ledger.push({
        id: `tx-${tenant.id}-${i}`,
        tenantId: tenant.id,
        tenantName: tenant.name,
        type,
        amount,
        value,
        description,
        date: formatISO(subDays(new Date(), daysAgo))
      });
    }
  });
  
  return ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<SaaSTenant[]>(() => {
    const stored = localStorage.getItem('saas_tenants');
    return stored ? JSON.parse(stored) : initialTenants;
  });

  const [plans, setPlans] = useState<SaaSPlan[]>(() => {
    const stored = localStorage.getItem('saas_plans_v3');
    return stored ? JSON.parse(stored) : initialPlans;
  });

  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>(() => {
    const stored = localStorage.getItem('saas_token_packages');
    return stored ? JSON.parse(stored) : initialTokenPackages;
  });

  const [saasSettings, setSaasSettings] = useState<SaaSSettings>(() => {
    const stored = localStorage.getItem('saas_settings');
    return stored ? JSON.parse(stored) : initialSaaSSettings;
  });

  // Initialize Ledger
  const [tokenLedger, setTokenLedger] = useState<SaaSTokenTransaction[]>(() => {
    const stored = localStorage.getItem('saas_token_ledger');
    return stored ? JSON.parse(stored) : generateMockLedger(initialTenants);
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

    // Record transaction in ledger
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

  // Metrics
  const totalMRR = tenants.filter(t => t.status === 'active').reduce((acc, t) => acc + t.mrr, 0);
  const activeTenantsCount = tenants.filter(t => t.status === 'active').length;
  
  // Token Metrics based on Ledger
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
