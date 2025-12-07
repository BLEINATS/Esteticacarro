import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SaaSPlan, SaaSTenant, TokenPackage } from '../types';
import { addDays, formatISO, subDays } from 'date-fns';

interface SuperAdminContextType {
  tenants: SaaSTenant[];
  plans: SaaSPlan[];
  tokenPackages: TokenPackage[];
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  
  // Tenant Actions
  addTenant: (tenant: Omit<SaaSTenant, 'id' | 'joinedAt' | 'status' | 'lastLogin'>) => void;
  updateTenant: (id: string, updates: Partial<SaaSTenant>) => void;
  deleteTenant: (id: string) => void;
  addTokensToTenant: (tenantId: string, amount: number) => void;
  
  // Plan Actions
  updatePlan: (id: string, updates: Partial<SaaSPlan>) => void;
  
  // Metrics
  totalMRR: number;
  activeTenantsCount: number;
  totalTokensSold: number;
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
    maxDiskSpace: 5,
    active: true
  },
  {
    id: 'pro',
    name: 'Intermediário',
    price: 107.00,
    features: ['Financeiro Completo', 'Gamificação & Fidelidade', 'Página Web da Loja', 'Comissões Automáticas'],
    includedTokens: 500,
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

export function SuperAdminProvider({ children }: { children: ReactNode }) {
  // Persist tenants in localStorage to simulate database
  const [tenants, setTenants] = useState<SaaSTenant[]>(() => {
    const stored = localStorage.getItem('saas_tenants');
    return stored ? JSON.parse(stored) : initialTenants;
  });

  const [plans, setPlans] = useState<SaaSPlan[]>(() => {
    // Changed key to force refresh of initial data with new prices
    // ATENÇÃO: Alterei para v3 para garantir que os novos preços (62, 107, 206) sejam carregados
    const stored = localStorage.getItem('saas_plans_v3');
    return stored ? JSON.parse(stored) : initialPlans;
  });

  const [tokenPackages] = useState<TokenPackage[]>(initialTokenPackages);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('saas_admin_auth') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('saas_tenants', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem('saas_plans_v3', JSON.stringify(plans));
  }, [plans]);

  const login = (password: string) => {
    // Hardcoded password for demo
    if (password === 'admin123') {
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
        // Recalculate MRR if plan changes
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
    setTenants(prev => prev.map(t => 
      t.id === tenantId ? { ...t, tokenBalance: t.tokenBalance + amount } : t
    ));
  };

  const updatePlan = (id: string, updates: Partial<SaaSPlan>) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // Metrics
  const totalMRR = tenants.filter(t => t.status === 'active').reduce((acc, t) => acc + t.mrr, 0);
  const activeTenantsCount = tenants.filter(t => t.status === 'active').length;
  const totalTokensSold = tenants.reduce((acc, t) => acc + t.tokenBalance, 0); // Simplified metric

  return (
    <SuperAdminContext.Provider value={{
      tenants,
      plans,
      tokenPackages,
      isAuthenticated,
      login,
      logout,
      addTenant,
      updateTenant,
      deleteTenant,
      addTokensToTenant,
      updatePlan,
      totalMRR,
      activeTenantsCount,
      totalTokensSold
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
