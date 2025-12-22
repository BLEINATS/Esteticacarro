import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { 
  Client, InventoryItem, WorkOrder, ServiceRecipe, Reminder, Vehicle, 
  ServiceCatalogItem, PriceMatrixEntry, VehicleSize, Employee, Task, 
  EmployeeTransaction, MarketingCampaign,
  CompanySettings, SubscriptionDetails, FinancialTransaction, ClientPoints, FidelityCard, Reward,
  Redemption, TierConfig, TierLevel, ShopOwner, Notification, ServiceConsumption, AuthResponse,
  SystemAlert, SocialPost, CustomAutomation, MessageLog, VEHICLE_SIZES
} from '../types';
import { addDays, formatISO } from 'date-fns';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { isValidUUID, generateUUID, formatId } from '../lib/utils';
import { MOCK_ALERTS } from '../lib/mockData';
import { CAMPAIGN_TEMPLATES } from '../services/campaignService';
import { DEFAULT_TERMS, DEFAULT_PRIVACY } from '../lib/legalDefaults';
// ... (Keep existing constants: defaultTiers, PLAN_CONFIG)
const defaultTiers: TierConfig[] = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, color: 'from-amber-500 to-amber-600', benefits: ['5% de desconto'] },
  { id: 'silver', name: 'Prata', minPoints: 1000, color: 'from-slate-400 to-slate-600', benefits: ['10% de desconto', 'Frete grátis'] },
  { id: 'gold', name: 'Ouro', minPoints: 3000, color: 'from-yellow-500 to-yellow-600', benefits: ['15% de desconto', 'Atendimento prioritário'] },
  { id: 'platinum', name: 'Platina', minPoints: 5000, color: 'from-blue-500 to-blue-600', benefits: ['20% de desconto', 'Brinde exclusivo'] }
];
const PLAN_CONFIG = {
  starter: {
    maxEmployees: 2,
    features: ['agenda', 'clients', 'operations', 'inventory', 'pricing', 'team']
  },
  pro: {
    maxEmployees: 6,
    features: ['agenda', 'clients', 'operations', 'inventory', 'pricing', 'team', 'finance', 'gamification', 'website']
  },
  enterprise: {
    maxEmployees: 999,
    features: ['agenda', 'clients', 'operations', 'inventory', 'pricing', 'team', 'finance', 'gamification', 'website', 'marketing', 'marketing_automation', 'social_studio']
  },
  trial: {
    maxEmployees: 999,
    features: ['agenda', 'clients', 'operations', 'inventory', 'pricing', 'team', 'finance', 'gamification', 'website', 'marketing', 'marketing_automation', 'social_studio']
  }
};
export const initialCompanySettings: CompanySettings = {
  name: 'Minha Oficina',
  slug: 'minha-oficina',
  responsibleName: '',
  cnpj: '',
  email: '',
  phone: '',
  address: '',
  logoUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=150&q=80',
  initialBalance: 0,
  hourlyRate: 50, // Default value for Service Pricing
  whatsapp: {
    enabled: true,
    session: { status: 'disconnected' },
    templates: {
      welcome: 'Olá {cliente}! Bem-vindo. Seu cadastro foi realizado com sucesso.',
      completion: 'Olá {cliente}! O serviço no seu {veiculo} foi concluído. Valor Total: {valor}. Aguardamos sua retirada!',
      nps: 'Olá {cliente}, como foi sua experiência? Responda de 0 a 10.',
      recall: 'Olá {cliente}, já faz um tempo que cuidamos do seu {veiculo}. Que tal renovar a proteção?',
      birthday: 'Parabéns {cliente}! 🎉 Feliz aniversário! Temos um presente especial para você na sua próxima visita.',
      appointmentReminder: 'Olá {cliente}, lembrete do seu agendamento amanhã às {horario} para o veículo {veiculo}.',
      reviewRequest: 'Olá {cliente}! Gostou do serviço no {veiculo}? ⭐ Ajude-nos com sua avaliação 5 estrelas no Google: https://g.page/sua-loja/review'
    }
  },
  landingPage: {
    enabled: true,
    heroTitle: 'Estética Automotiva de Alto Padrão',
    heroSubtitle: 'Cuidamos do seu carro com a excelência que ele merece.',
    heroImage: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1920&q=80',
    primaryColor: '#2563eb',
    showServices: true,
    showTestimonials: true,
    whatsappMessage: 'Olá, gostaria de agendar uma visita.'
  },
  preferences: {
    theme: 'dark',
    language: 'pt-BR',
    notifications: {
      lowStock: true,
      osUpdates: true,
      marketing: false,
      financial: true,
      security: true,
      channels: { email: true, whatsapp: false, system: true }
    }
  },
  gamification: {
    enabled: true,
    levelSystem: true,
    pointsMultiplier: 1,
    tiers: defaultTiers
  },
  automations: {
    birthday: true,
    nps: true,
    churnRecovery: false,
    appointmentReminders: true,
    reviewRequest: false
  },
  customAutomations: [],
  legal: {
      termsText: DEFAULT_TERMS,
      privacyText: DEFAULT_PRIVACY
  }
};
const initialSubscription: SubscriptionDetails = {
  planId: 'trial',
  status: 'trial',
  nextBillingDate: formatISO(addDays(new Date(), 7)),
  paymentMethod: 'Nenhum',
  tokenBalance: 10,
  tokenHistory: [],
  invoices: []
};
interface AppContextType {
  inventory: InventoryItem[];
  workOrders: WorkOrder[];
  clients: Client[];
  recipes: ServiceRecipe[];
  reminders: Reminder[];
  services: ServiceCatalogItem[];
  priceMatrix: PriceMatrixEntry[];
  employees: Employee[];
  employeeTransactions: EmployeeTransaction[];
  financialTransactions: FinancialTransaction[];
  clientPoints: ClientPoints[];
  fidelityCards: FidelityCard[];
  rewards: Reward[];
  redemptions: Redemption[];
  serviceConsumptions: ServiceConsumption[];
  currentUser: Employee | null; 
  ownerUser: ShopOwner | null; 
  tenantId: string | null;
  isAppLoading: boolean;
  theme: 'light' | 'dark';
  campaigns: MarketingCampaign[];
  socialPosts: SocialPost[];
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  systemAlerts: SystemAlert[];
  markAlertResolved: (id: string) => void;
  companySettings: CompanySettings;
  subscription: SubscriptionDetails;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  checkPermission: (feature: string) => boolean;
  checkLimit: (resource: 'employees', currentCount: number) => boolean;
  planLimits: { maxEmployees: number };
  buyTokens: (amount: number, cost: number) => void;
  consumeTokens: (amount: number, description: string, context?: { clientId?: string, phone?: string, message?: string }) => boolean;
  changePlan: (planId: 'starter' | 'pro' | 'enterprise' | 'trial') => void;
  cancelSubscription: () => Promise<void>;
  forceSyncToCloud: () => Promise<void>;
  connectWhatsapp: () => Promise<void>;
  disconnectWhatsapp: () => Promise<void>;
  simulateWhatsappScan: () => void;
  messageLogs: MessageLog[];
  login: (pin: string) => boolean; 
  logout: () => void; 
  loginOwner: (email: string, password: string) => Promise<AuthResponse>;
  registerOwner: (name: string, email: string, shopName: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutOwner: () => Promise<void>;
  updateOwner: (updates: { name?: string; email?: string; password?: string }) => Promise<boolean>;
  createTenant: (name: string, phone: string) => Promise<boolean>;
  reloadUserData: () => Promise<boolean>; 
  addWorkOrder: (os: WorkOrder) => Promise<boolean>;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => Promise<boolean>;
  completeWorkOrder: (id: string, orderSnapshot?: WorkOrder) => void;
  recalculateClientMetrics: (clientId: string) => void;
  updateClientLTV: (clientId: string, amount: number) => void;
  updateClientVisits: (clientId: string, amount: number) => void;
  submitNPS: (workOrderId: string, score: number, comment?: string) => void;
  addClient: (client: Partial<Client>) => Promise<Client | null>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addVehicle: (clientId: string, vehicle: Partial<Vehicle>) => Promise<void>;
  updateVehicle: (clientId: string, vehicle: Vehicle) => Promise<void>;
  removeVehicle: (clientId: string, vehicleId: string) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'status'>) => void;
  updateInventoryItem: (id: number, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: number) => void;
  deductStock: (serviceId: string) => void;
  toggleTheme: () => void;
  generateReminders: (os: WorkOrder) => void;
  addService: (service: Partial<ServiceCatalogItem>) => void;
  updateService: (id: string, updates: Partial<ServiceCatalogItem>) => void;
  deleteService: (id: string) => void; 
  updatePrice: (serviceId: string, size: VehicleSize, newPrice: number) => Promise<void>;
  updateServiceInterval: (serviceId: string, days: number) => void;
  bulkUpdatePrices: (targetSize: VehicleSize | 'all', percentage: number) => Promise<void>;
  getPrice: (serviceId: string, size: VehicleSize) => number;
  updateServiceConsumption: (consumption: ServiceConsumption) => Promise<boolean>;
  getServiceConsumption: (serviceId: string) => ServiceConsumption | undefined;
  calculateServiceCost: (serviceId: string) => number;
  addEmployee: (employee: Omit<Employee, 'id' | 'balance'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  assignTask: (workOrderId: string, serviceId: string, employeeId: string) => void;
  startTask: (taskId: string) => void;
  stopTask: (taskId: string) => void;
  addEmployeeTransaction: (trans: EmployeeTransaction) => void;
  updateEmployeeTransaction: (id: string, updates: Partial<EmployeeTransaction>) => void; 
  deleteEmployeeTransaction: (id: string) => void; 
  addFinancialTransaction: (trans: FinancialTransaction) => void;
  updateFinancialTransaction: (id: number, updates: Partial<FinancialTransaction>) => void;
  deleteFinancialTransaction: (id: number) => void;
  createCampaign: (campaign: MarketingCampaign) => void;
  updateCampaign: (id: string, updates: Partial<MarketingCampaign>) => void;
  deleteCampaign: (id: string) => void;
  seedDefaultCampaigns: () => Promise<void>;
  seedMockReviews: () => Promise<void>;
  getWhatsappLink: (phone: string, message: string) => string;
  createSocialPost: (post: SocialPost) => void;
  generateSocialContent: (workOrder: WorkOrder) => Promise<{ caption: string; hashtags: string[] }>;
  addPointsToClient: (clientId: string, workOrderId: string, points: number, description: string) => void;
  getClientPoints: (clientId: string) => ClientPoints | undefined;
  createFidelityCard: (clientId: string) => Promise<FidelityCard>;
  getFidelityCard: (clientId: string) => FidelityCard | undefined;
  addReward: (reward: Omit<Reward, 'id' | 'createdAt'>) => void;
  updateReward: (id: string, updates: Partial<Reward>) => void;
  deleteReward: (id: string) => void;
  getRewardsByLevel: (level: TierLevel) => Reward[];
  updateTierConfig: (tiers: TierConfig[]) => void;
  claimReward: (clientId: string, rewardId: string) => { success: boolean; message: string; voucherCode?: string };
  getClientRedemptions: (clientId: string) => Redemption[];
  useVoucher: (code: string, workOrderId: string) => boolean;
  getVoucherDetails: (code: string) => { redemption: Redemption; reward: Reward | undefined } | null;
  generatePKPass: (clientId: string) => string;
  generateGoogleWallet: (clientId: string) => string;
  seedDefaultRewards: () => Promise<void>;
}
const AppContext = createContext<AppContextType | undefined>(undefined);
export function AppProvider({ children }: { children: ReactNode }) {
  // ... (State declarations)
  const [ownerUser, setOwnerUser] = useState<ShopOwner | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(initialCompanySettings);
  const [subscription, setSubscription] = useState<SubscriptionDetails>(initialSubscription);
  const [inventory, setInventory] = useState<InventoryItem[]>([]); 
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [priceMatrix, setPriceMatrix] = useState<PriceMatrixEntry[]>([]);
  const [serviceConsumptions, setServiceConsumptions] = useState<ServiceConsumption[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]); 
  const [employeeTransactions, setEmployeeTransactions] = useState<EmployeeTransaction[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [clientPoints, setClientPoints] = useState<ClientPoints[]>([]);
  const [fidelityCards, setFidelityCards] = useState<FidelityCard[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]); 
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]); 
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [recipes] = useState<ServiceRecipe[]>([]);
  // Refs for fresh state access in async functions
  const priceMatrixRef = useRef(priceMatrix);
  const servicesRef = useRef(services);
  // Update refs whenever state changes
  useEffect(() => { priceMatrixRef.current = priceMatrix; }, [priceMatrix]);
  useEffect(() => { servicesRef.current = services; }, [services]);
  // ... (Effects and basic functions) ...
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  const checkPermission = useCallback((feature: string) => {
    const plan = subscription.planId || 'starter';
    const config = PLAN_CONFIG[plan] || PLAN_CONFIG.starter;
    return config.features.includes(feature);
  }, [subscription.planId]);
  const checkLimit = useCallback((resource: 'employees', currentCount: number) => {
    const plan = subscription.planId || 'starter';
    const config = PLAN_CONFIG[plan] || PLAN_CONFIG.starter;
    if (resource === 'employees') {
        return currentCount < config.maxEmployees;
    }
    return true;
  }, [subscription.planId]);
  const planLimits = useMemo(() => {
      const plan = subscription.planId || 'starter';
      const config = PLAN_CONFIG[plan] || PLAN_CONFIG.starter;
      return { maxEmployees: config.maxEmployees };
  }, [subscription.planId]);
  const updateCompanySettings = async (settings: Partial<CompanySettings>) => {
    const newSettings = { ...companySettings, ...settings };
    setCompanySettings(newSettings);
    if (tenantId) {
      if (isValidUUID(tenantId)) {
        await supabase.from('tenants').update({ settings: newSettings }).eq('id', tenantId);
      }
      await db.update('tenants', tenantId, { settings: newSettings });
    }
  };
  // ... (Notification and Token functions) ...
  useEffect(() => {
    const timer = setTimeout(() => {
        if (notifications.length === 0) {
            setNotifications([
                {
                    id: 'n1',
                    type: 'info',
                    title: 'Bem-vindo ao Sistema',
                    message: 'O sistema de notificações está ativo e pronto para uso.',
                    read: false,
                    createdAt: new Date().toISOString()
                }
            ]);
        }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const clearAllNotifications = () => {
    setNotifications([]);
  };
  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
      ...notification
    };
    setNotifications(prev => [newNotification, ...prev]);
  };
  const markAlertResolved = async (id: string) => {
    setSystemAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
    if (tenantId && isValidUUID(tenantId)) {
        await supabase.from('alerts').update({ resolved: true }).eq('id', id);
    }
    await db.update('alerts', id, { resolved: true });
  };
  const buyTokens = async (amount: number, cost: number) => {
      const newBalance = (subscription.tokenBalance || 0) + amount;
      const newSubscription = { ...subscription, tokenBalance: newBalance };
      setSubscription(newSubscription);
      if (tenantId) {
          if (isValidUUID(tenantId)) {
              await supabase.from('tenants').update({ subscription: newSubscription }).eq('id', tenantId);
          }
          await db.update('tenants', tenantId, { subscription: newSubscription });
      }
  };
  const consumeTokens = (amount: number, description: string) => {
      if ((subscription.tokenBalance || 0) < amount) return false;
      const newBalance = (subscription.tokenBalance || 0) - amount;
      const newSubscription = { ...subscription, tokenBalance: newBalance };
      setSubscription(newSubscription);
      if (tenantId) {
          if (isValidUUID(tenantId)) {
              supabase.from('tenants').update({ subscription: newSubscription }).eq('id', tenantId);
          }
          db.update('tenants', tenantId, { subscription: newSubscription });
      }
      return true;
  };
  const changePlan = async (planId: 'starter' | 'pro' | 'enterprise' | 'trial') => {
      const newSubscription = { ...subscription, planId, status: 'active' };
      setSubscription(newSubscription as any);
      if (tenantId) {
          if (isValidUUID(tenantId)) {
              await supabase.from('tenants').update({ plan_id: planId, subscription: newSubscription }).eq('id', tenantId);
          }
          await db.update('tenants', tenantId, { plan_id: planId, subscription: newSubscription });
      }
  };
  const cancelSubscription = async () => {
      const newSubscription = { ...subscription, status: 'inactive' };
      setSubscription(newSubscription as any);
      if (tenantId) {
          if (isValidUUID(tenantId)) {
              await supabase.from('tenants').update({ status: 'cancelled', subscription: newSubscription }).eq('id', tenantId);
          }
          await db.update('tenants', tenantId, { status: 'cancelled', subscription: newSubscription });
      }
  };
  const forceSyncToCloud = async () => {
      console.log("Syncing...");
  };
  const connectWhatsapp = async () => {
      updateCompanySettings({ whatsapp: { ...companySettings.whatsapp, session: { status: 'scanning' } } });
  };
  const disconnectWhatsapp = async () => {
      updateCompanySettings({ whatsapp: { ...companySettings.whatsapp, session: { status: 'disconnected' } } });
  };
  const simulateWhatsappScan = async () => {
      updateCompanySettings({ whatsapp: { ...companySettings.whatsapp, session: { status: 'connected' } } });
  };
  // ... (Data loading logic) ...
  useEffect(() => {
    db.init();
    const storedUser = localStorage.getItem('cristal_care_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setOwnerUser(user);
      loadTenantData(user.id);
    } else {
      setIsAppLoading(false);
    }
  }, []);
  const loadTenantData = async (userId: string) => {
    setIsAppLoading(true);
    try {
      let tenantData: any = null;
      try {
        if (isValidUUID(userId)) {
            const { data: remoteTenants, error } = await supabase
                .from('tenants')
                .select('*')
                .eq('owner_id', userId);
            if (!error && remoteTenants && remoteTenants.length > 0) {
                tenantData = remoteTenants[0];
                await db.update('tenants', tenantData.id, tenantData);
            }
        }
      } catch (err) {
          console.warn("Supabase fetch failed, falling back to local DB", err);
      }
      if (!tenantData) {
          const localTenants = await db.getAll<any>('tenants');
          tenantData = localTenants.find(t => t.owner_id === userId);
      }
      if (tenantData) {
        setTenantId(tenantData.id);
        const settings = { ...initialCompanySettings, ...(tenantData.settings || {}) };
        if (tenantData.settings?.whatsapp) settings.whatsapp = { ...initialCompanySettings.whatsapp, ...tenantData.settings.whatsapp };
        if (tenantData.settings?.landingPage) settings.landingPage = { ...initialCompanySettings.landingPage, ...tenantData.settings.landingPage };
        if (tenantData.settings?.preferences) settings.preferences = { ...initialCompanySettings.preferences, ...tenantData.settings.preferences };
        if (tenantData.settings?.gamification) settings.gamification = { ...initialCompanySettings.gamification, ...tenantData.settings.gamification };
        setCompanySettings(settings);
        if (settings.preferences?.theme) setTheme(settings.preferences.theme);
        setSubscription({ ...initialSubscription, ...(tenantData.subscription || {}) });
        // Load Inventory
        let remoteInventory: InventoryItem[] = [];
        if (isValidUUID(tenantData.id)) {
            try {
                const { data: invData } = await supabase.from('inventory').select('*').eq('tenant_id', tenantData.id);
                if (invData) {
                    remoteInventory = invData.map(i => ({
                        id: i.id,
                        name: i.name,
                        category: i.category,
                        stock: i.stock,
                        unit: i.unit,
                        minStock: i.min_stock,
                        costPrice: i.cost_price, // Correctly mapped from snake_case
                        status: i.status as any,
                        tenant_id: i.tenant_id
                    }));
                    for (const item of remoteInventory) { await db.update('inventory', item.id, item); }
                }
            } catch (err) { console.error("Failed to load inventory from Supabase", err); }
        }
        // Load Services
        let remoteServices: ServiceCatalogItem[] = [];
        if (isValidUUID(tenantData.id)) {
            try {
                const { data: svcData } = await supabase.from('services').select('*').eq('tenant_id', tenantData.id);
                if (svcData) {
                    remoteServices = svcData.map(s => ({
                        id: s.id,
                        name: s.name,
                        category: s.category,
                        description: s.description || '',
                        standardTimeMinutes: s.standard_time,
                        active: s.active,
                        returnIntervalDays: s.return_interval_days || 0,
                        showOnLandingPage: s.show_on_landing_page ?? true,
                        imageUrl: s.image_url || '',
                        price_matrix: s.price_matrix as any,
                        tenant_id: s.tenant_id
                    }));
                    for (const srv of remoteServices) { await db.update('services', srv.id, srv); }
                }
            } catch (err) { console.error("Failed to load services from Supabase", err); }
        }
        // Load Clients and Vehicles from Supabase (SYNC FIX)
        if (isValidUUID(tenantData.id)) {
            try {
                const { data: remoteClients, error: clientError } = await supabase.from('clients').select('*').eq('tenant_id', tenantData.id);
                if (clientError) throw clientError;
                if (remoteClients) {
                    for (const c of remoteClients) {
                        const client: Client = {
                            id: c.id,
                            name: c.name,
                            phone: c.phone,
                            email: c.email || undefined,
                            address: typeof c.address_data === 'string' ? c.address_data : (c.address_data as any)?.address,
                            cep: (c.address_data as any)?.cep,
                            street: (c.address_data as any)?.street,
                            number: (c.address_data as any)?.number,
                            neighborhood: (c.address_data as any)?.neighborhood,
                            city: (c.address_data as any)?.city,
                            state: (c.address_data as any)?.state,
                            ltv: c.ltv,
                            visitCount: c.visit_count,
                            lastVisit: c.last_visit || '',
                            status: c.status as any,
                            segment: c.segment as any,
                            notes: c.notes || undefined,
                            vehicles: [], // Will be populated by vehicle fetch
                            tenant_id: c.tenant_id,
                            created_at: c.created_at
                        };
                        await db.update('clients', client.id, client);
                    }
                }
                // Load Vehicles from Supabase (SYNC FIX)
                const { data: remoteVehicles, error: vehicleError } = await supabase.from('vehicles').select('*').eq('tenant_id', tenantData.id);
                if (vehicleError) throw vehicleError;
                if (remoteVehicles) {
                    for (const v of remoteVehicles) {
                        const vehicle: Vehicle = {
                            id: v.id,
                            model: v.model,
                            plate: v.plate,
                            color: v.color,
                            year: v.year,
                            size: v.size as any,
                            client_id: v.client_id,
                            tenant_id: v.tenant_id
                        };
                        await db.update('vehicles', vehicle.id, vehicle);
                    }
                }
            } catch (err) {
                console.error("Failed to sync clients/vehicles from Supabase", err);
            }
        }
        // Load Work Orders from Supabase (FIX FOR PERSISTENCE)
        if (isValidUUID(tenantData.id)) {
            try {
                const { data: remoteOrders } = await supabase.from('work_orders').select('*').eq('tenant_id', tenantData.id);
                if (remoteOrders) {
                    for (const order of remoteOrders) {
                        // Merge json_data with column data, prioritizing column data for critical fields
                        const fullOrder = {
                            ...order.json_data as any, // Spread JSON first
                            id: order.id,
                            status: order.status,
                            totalValue: order.total_value,
                            paymentStatus: order.payment_status,
                            paymentMethod: order.payment_method,
                            npsScore: order.nps_score,
                            tenant_id: order.tenant_id
                        };
                        await db.update('work_orders', order.id, fullOrder);
                    }
                }
            } catch (err) { console.error("Failed to load work orders", err); }
        }
        const [
          clientsData, vehiclesData, wosData, invData, servicesData, empData, finData,
          rewardsData, redemptionsData, cardsData, historyData, campaignsData, alertsData, remindersData, empTransData,
          msgLogsData
        ] = await Promise.all([
          db.getAll<any>('clients'),
          db.getAll<any>('vehicles'),
          db.getAll<any>('work_orders'),
          db.getAll<any>('inventory'),
          db.getAll<any>('services'),
          db.getAll<any>('employees'),
          db.getAll<any>('financial_transactions'),
          db.getAll<any>('rewards'),
          db.getAll<any>('redemptions'),
          db.getAll<any>('fidelity_cards'),
          db.getAll<any>('points_history'),
          db.getAll<any>('marketing_campaigns'),
          db.getAll<any>('alerts'),
          db.getAll<any>('reminders'),
          db.getAll<any>('employee_transactions'),
          db.getAll<any>('message_logs')
        ]);
        // FIX: Ensure vehicles is always an array to prevent "not iterable" error
        const clientsWithVehicles = clientsData.map(c => ({
            ...c,
            vehicles: Array.isArray(vehiclesData) ? vehiclesData.filter(v => v.client_id === c.id) : [] 
        }));
        setClients(clientsWithVehicles);
        // FIX: Spread json_data FIRST, then override with top-level properties to ensure latest state wins
        setWorkOrders(wosData.map(o => ({ ...o.json_data, ...o })));
        setInventory(remoteInventory.length > 0 ? remoteInventory : invData);
        const servicesSource = remoteServices.length > 0 ? remoteServices : servicesData;
        const mappedServices = servicesSource.map(s => ({ ...s, ...s.price_matrix }));
        setServices(mappedServices);
        setReminders(remindersData);
        const matrix: PriceMatrixEntry[] = [];
        const consumptionsList: ServiceConsumption[] = [];
        servicesSource.forEach(s => {
          const prices = s.price_matrix?.prices || {};
          Object.entries(prices).forEach(([size, price]) => {
            matrix.push({ serviceId: s.id, size: size as VehicleSize, price: Number(price) });
          });
          if (s.price_matrix?.consumption) {
            consumptionsList.push({ serviceId: s.id, items: s.price_matrix.consumption });
          }
        });
        setPriceMatrix(matrix);
        setServiceConsumptions(consumptionsList);
        setEmployees(empData.map(e => ({ ...e, ...e.salary_data })));
        setEmployeeTransactions(empTransData);
        setFinancialTransactions(finData);
        setRewards(rewardsData.map(r => ({ ...r, ...r.config })));
        setRedemptions(redemptionsData);
        setFidelityCards(cardsData.map(c => ({ ...c, clientId: c.client_id, cardNumber: c.card_number })));
        setPointsHistory(historyData);
        setCampaigns(campaignsData);
        setMessageLogs(msgLogsData);
        setSystemAlerts(alertsData.length > 0 ? alertsData : MOCK_ALERTS.map(a => ({...a, tenant_id: tenantData.id})));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsAppLoading(false);
    }
  };
  // ... (Auth functions) ...
  const loginOwner = async (email: string, pass: string): Promise<AuthResponse> => {
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password: pass
        });
        if (!authError && authData.user) {
            const { data: tenantData } = await supabase.from('tenants').select('*').eq('owner_id', authData.user.id).single();
            const user: ShopOwner = {
                id: authData.user.id,
                name: authData.user.user_metadata.name || 'Usuário',
                email: authData.user.email!,
                shopName: tenantData?.name || 'Minha Loja'
            };
            localStorage.setItem('cristal_care_user', JSON.stringify(user));
            setOwnerUser(user);
            await db.create('users', { ...user, password: '***' });
            loadTenantData(user.id);
            return { success: true };
        }
        const users = await db.getAll<any>('users');
        const user = users.find(u => u.email === email && u.password === pass);
        if (user) {
            const owner: ShopOwner = { id: user.id, name: user.name, email: user.email, shopName: user.shopName };
            localStorage.setItem('cristal_care_user', JSON.stringify(owner));
            setOwnerUser(owner);
            loadTenantData(owner.id);
            return { success: true };
        }
        return { success: false, error: { message: 'Credenciais inválidas.' } };
    } catch (error) {
        return { success: false, error: { message: 'Erro ao conectar.' } };
    }
  };
  const registerOwner = async (name: string, email: string, shopName: string, pass: string) => {
    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password: pass,
            options: { data: { name, shopName } }
        });
        let userId = `user-${Date.now()}`;
        let isOnline = false;
        if (!authError && authData.user) {
            userId = authData.user.id;
            isOnline = true;
        }
        const newUser = { id: userId, name, email, password: pass, shopName };
        await db.create('users', newUser);
        await createTenant(shopName, '', userId, isOnline);
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Erro ao registrar.' };
    }
  };
  const createTenant = async (name: string, phone: string, userId?: string, isOnline = false) => {
      const ownerId = userId || ownerUser?.id;
      if (!ownerId) return false;
      const newTenant = {
          id: isOnline ? undefined : `tenant-${Date.now()}`,
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          owner_id: ownerId,
          plan_id: 'trial',
          status: 'trial',
          settings: { ...initialCompanySettings, name, phone },
          subscription: initialSubscription,
          created_at: new Date().toISOString()
      };
      if (isOnline) {
          const { data, error } = await supabase.from('tenants').insert(newTenant).select().single();
          if (!error && data) {
              await db.create('tenants', data);
              setTenantId(data.id);
              return true;
          }
      }
      const localTenant = await db.create('tenants', { ...newTenant, id: `tenant-${Date.now()}` });
      setTenantId(localTenant.id);
      return true;
  };
  const updateOwner = async (updates: { name?: string; email?: string; password?: string }) => {
      if (!ownerUser) return false;
      const updatedUser = { ...ownerUser, ...updates };
      setOwnerUser(updatedUser);
      localStorage.setItem('cristal_care_user', JSON.stringify(updatedUser));
      const users = await db.getAll<any>('users');
      const userRecord = users.find(u => u.id === ownerUser.id);
      if (userRecord) {
          await db.update('users', userRecord.id, updates);
      }
      if (updates.password) {
          await supabase.auth.updateUser({ password: updates.password });
      }
      if (updates.email) {
          await supabase.auth.updateUser({ email: updates.email });
      }
      return true;
  };
  const logoutOwner = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('cristal_care_user');
    setOwnerUser(null);
    setTenantId(null);
  };
  const reloadUserData = async () => {
      const storedUser = localStorage.getItem('cristal_care_user');
      if (storedUser) {
          const user = JSON.parse(storedUser);
          setOwnerUser(user);
          await loadTenantData(user.id);
          return true;
      }
      return false;
  };
  // --- HELPER FUNCTIONS ---
  const getServiceConsumption = useCallback((serviceId: string) => {
    return serviceConsumptions.find(sc => sc.serviceId === serviceId);
  }, [serviceConsumptions]);
  const deductStock = (serviceId: string) => {
      const consumption = getServiceConsumption(serviceId);
      if (consumption) {
          consumption.items.forEach(item => {
              const invItem = inventory.find(i => i.id === item.inventoryId);
              if (invItem) {
                  let deductAmount = item.quantity;
                  if (invItem.unit === 'L' && item.usageUnit === 'ml') deductAmount = item.quantity / 1000;
                  const newStock = Math.max(0, invItem.stock - deductAmount);
                  updateInventoryItem(invItem.id, { stock: newStock });
              }
          });
      }
  };
  const calculateServiceCost = useCallback((serviceId: string) => {
      const consumption = getServiceConsumption(serviceId);
      if (!consumption || !consumption.items) return 0;
      return consumption.items.reduce((total, item) => {
          // FIX: Use loose equality (==) to match number/string IDs
          const invItem = inventory.find(i => i.id == item.inventoryId);
          if (!invItem) return total;
          let multiplier = 1;
          const invUnit = invItem.unit ? invItem.unit.toLowerCase() : '';
          const usageUnit = item.usageUnit ? item.usageUnit.toLowerCase() : '';
          if (invUnit === 'l' && usageUnit === 'ml') multiplier = 0.001;
          else if (invUnit === 'kg' && usageUnit === 'g') multiplier = 0.001;
          else if (invUnit === 'ml' && usageUnit === 'l') multiplier = 1000;
          else if (invUnit === 'g' && usageUnit === 'kg') multiplier = 1000;
          const cost = Number(invItem.costPrice) || 0;
          const qty = Number(item.quantity) || 0;
          return total + (cost * qty * multiplier);
      }, 0);
  }, [getServiceConsumption, inventory]);
  // ... (CRUD Functions) ...
  const addWorkOrder = async (os: WorkOrder) => {
    const newOS = { ...os, tenant_id: tenantId };
    // CLOUD FIRST: Save to Supabase
    if (tenantId && isValidUUID(tenantId) && isValidUUID(newOS.id)) {
        const { error } = await supabase.from('work_orders').insert({
            id: newOS.id,
            tenant_id: tenantId,
            client_id: newOS.clientId,
            vehicle_plate: newOS.plate,
            service_summary: newOS.service,
            status: newOS.status,
            total_value: newOS.totalValue,
            technician: newOS.technician,
            deadline: newOS.deadline,
            created_at: newOS.createdAt,
            payment_status: newOS.paymentStatus,
            payment_method: newOS.paymentMethod,
            json_data: newOS
        });
        if (error) {
            console.error("Supabase sync error:", error);
            throw error; // Propagate error to UI
        }
    }
    // Save to Local
    const saved = await db.create('work_orders', newOS);
    setWorkOrders(prev => [saved, ...prev]);
    return true;
  };
  const updateWorkOrder = async (id: string, updates: Partial<WorkOrder>) => {
    // CLOUD FIRST: Update Supabase
    if (tenantId && isValidUUID(tenantId) && isValidUUID(id)) {
        const { error } = await supabase.from('work_orders').update({
            status: updates.status,
            total_value: updates.totalValue,
            payment_status: updates.paymentStatus,
            payment_method: updates.paymentMethod,
            json_data: updates 
        }).eq('id', id);
        if (error) {
            console.error("Supabase update error:", error);
            return false;
        }
    }
    const updated = await db.update('work_orders', id, updates);
    if (updated) {
      setWorkOrders(prev => prev.map(o => o.id === id ? updated : o));
      return true;
    }
    return false;
  };
  const completeWorkOrder = async (id: string, orderSnapshot?: WorkOrder) => {
      const os = orderSnapshot || workOrders.find(o => o.id === id);
      if (!os) return;
      await updateWorkOrder(id, { status: 'Concluído' });
      if (companySettings.gamification?.enabled && os.clientId) {
          const points = Math.floor(os.totalValue * (companySettings.gamification.pointsMultiplier || 1));
          addPointsToClient(os.clientId, os.id, points, `Serviço: ${os.service}`);
      }
      if (os.serviceId) {
          deductStock(os.serviceId);
      } else if (os.serviceIds) {
          os.serviceIds.forEach(sid => deductStock(sid));
      }
      const technician = employees.find(e => e.name === os.technician);
      if (technician && technician.salaryType !== 'fixed') {
          const baseValue = technician.commissionBase === 'net' ? os.totalValue : os.totalValue; 
          const commission = baseValue * (technician.commissionRate / 100);
          addEmployeeTransaction({
              id: `comm-${Date.now()}`,
              employeeId: technician.id,
              type: 'commission',
              amount: commission,
              description: `Comissão OS ${formatId(os.id)}`,
              date: new Date().toISOString(),
              relatedWorkOrderId: os.id
          });
      }
      generateReminders(os);
  };
  // ... (Other CRUD functions) ...
  const recalculateClientMetrics = async (clientId: string) => {
      const clientOrders = workOrders.filter(o => o.clientId === clientId && (o.status === 'Concluído' || o.status === 'Entregue'));
      const totalSpent = clientOrders.reduce((acc, o) => acc + o.totalValue, 0);
      const visits = clientOrders.length;
      const lastVisit = clientOrders.length > 0 
        ? clientOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt 
        : null;
      await updateClient(clientId, { ltv: totalSpent, visitCount: visits, lastVisit: lastVisit || '' });
  };
  const updateClientLTV = (clientId: string, amount: number) => {
      const client = clients.find(c => c.id === clientId);
      if (client) {
          updateClient(clientId, { ltv: (client.ltv || 0) + amount });
      }
  };
  const updateClientVisits = (clientId: string, amount: number) => {
      const client = clients.find(c => c.id === clientId);
      if (client) {
          updateClient(clientId, { visitCount: (client.visitCount || 0) + amount });
      }
  };
  const submitNPS = async (workOrderId: string, score: number, comment?: string) => {
      await updateWorkOrder(workOrderId, { npsScore: score, npsComment: comment });
  };
  const addClient = async (client: Partial<Client>) => {
    // Generate UUID if not present
    const id = client.id || generateUUID();
    // Ensure vehicles is initialized as array
    const newClient = { ...client, id, tenant_id: tenantId, vehicles: client.vehicles || [] } as Client;
    // CLOUD FIRST: Save to Supabase
    if (tenantId && isValidUUID(tenantId)) {
        const { error } = await supabase.from('clients').insert({
            id: newClient.id,
            tenant_id: tenantId,
            name: newClient.name,
            phone: newClient.phone,
            email: newClient.email,
            ltv: newClient.ltv,
            visit_count: newClient.visitCount,
            status: newClient.status,
            segment: newClient.segment,
            notes: newClient.notes,
            address_data: { 
                address: newClient.address, 
                cep: newClient.cep, 
                street: newClient.street, 
                number: newClient.number, 
                neighborhood: newClient.neighborhood, 
                city: newClient.city, 
                state: newClient.state 
            }
        });
        if (error) {
            console.error("Error saving client to Supabase:", error);
            throw error;
        }
    }
    // Save to Local
    const saved = await db.create('clients', newClient);
    setClients(prev => [saved, ...prev]);
    return saved;
  };
  const updateClient = async (id: string, updates: Partial<Client>) => {
    // CLOUD FIRST: Update Supabase
    if (tenantId && isValidUUID(tenantId)) {
        const payload: any = {
            name: updates.name,
            phone: updates.phone,
            email: updates.email,
            ltv: updates.ltv,
            visit_count: updates.visitCount,
            last_visit: updates.lastVisit,
            status: updates.status,
            segment: updates.segment,
            notes: updates.notes
        };
        if (updates.address || updates.cep) {
            payload.address_data = { 
                address: updates.address, 
                cep: updates.cep, 
                street: updates.street, 
                number: updates.number, 
                neighborhood: updates.neighborhood, 
                city: updates.city, 
                state: updates.state 
            };
        }
        const { error } = await supabase.from('clients').update(payload).eq('id', id);
        if (error) throw error;
    }
    const updated = await db.update('clients', id, updates);
    if (updated) {
      setClients(prev => prev.map(c => c.id === id ? updated : c));
    }
  };
  const deleteClient = async (id: string) => {
    if (tenantId && isValidUUID(tenantId)) {
        await supabase.from('clients').delete().eq('id', id);
    }
    await db.delete('clients', id);
    setClients(prev => prev.filter(c => c.id !== id));
  };
  const addVehicle = async (clientId: string, vehicle: Partial<Vehicle>) => {
    const newVehicle = { ...vehicle, client_id: clientId, tenant_id: tenantId } as Vehicle;
    // Generate UUID if not present
    if (!newVehicle.id) newVehicle.id = generateUUID();
    // CLOUD FIRST: Save to Supabase
    if (tenantId && isValidUUID(tenantId)) {
        const { error } = await supabase.from('vehicles').insert({
            id: newVehicle.id,
            tenant_id: tenantId,
            client_id: clientId,
            model: newVehicle.model,
            plate: newVehicle.plate,
            color: newVehicle.color,
            year: newVehicle.year,
            size: newVehicle.size
        });
        if (error) throw error;
    }
    const saved = await db.create('vehicles', newVehicle);
    // FIX: Handle possibly undefined vehicles array in state update
    setClients(prev => prev.map(c => {
        if (c.id === clientId) {
            const currentVehicles = Array.isArray(c.vehicles) ? c.vehicles : [];
            return { ...c, vehicles: [...currentVehicles, saved] };
        }
        return c;
    }));
  };
  const updateVehicle = async (clientId: string, vehicle: Vehicle) => {
      // CLOUD FIRST: Update Supabase
      if (tenantId && isValidUUID(tenantId)) {
          const { error } = await supabase.from('vehicles').update({
              model: vehicle.model,
              plate: vehicle.plate,
              color: vehicle.color,
              year: vehicle.year,
              size: vehicle.size
          }).eq('id', vehicle.id);
          if (error) throw error;
      }
      await db.update('vehicles', vehicle.id, vehicle);
      setClients(prev => prev.map(c => {
          if (c.id === clientId) {
              return { ...c, vehicles: c.vehicles.map(v => v.id === vehicle.id ? vehicle : v) };
          }
          return c;
      }));
  };
  const removeVehicle = async (clientId: string, vehicleId: string) => {
      if (tenantId && isValidUUID(tenantId)) {
          await supabase.from('vehicles').delete().eq('id', vehicleId);
      }
      await db.delete('vehicles', vehicleId);
      setClients(prev => prev.map(c => {
          if (c.id === clientId) {
              return { ...c, vehicles: c.vehicles.filter(v => v.id !== vehicleId) };
          }
          return c;
      }));
  };
  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'status'>) => {
    const newItem = { 
        ...item, 
        status: item.stock <= item.minStock ? (item.stock === 0 ? 'critical' : 'warning') : 'ok',
        tenant_id: tenantId
    } as InventoryItem;
    
    const saved = await db.create('inventory', { ...newItem, id: Date.now() }); 
    setInventory(prev => [...prev, saved]);
    if (tenantId && isValidUUID(tenantId)) {
        supabase.from('inventory').insert({
            id: saved.id,
            tenant_id: tenantId,
            name: saved.name,
            category: saved.category,
            stock: saved.stock,
            unit: saved.unit,
            min_stock: saved.minStock,
            cost_price: saved.costPrice,
            status: saved.status
        });
    }
  };
  const updateInventoryItem = async (id: number, updates: Partial<InventoryItem>) => {
    const current = inventory.find(i => i.id === id);
    if (!current) return;
    const updatedItem = { ...current, ...updates };
    updatedItem.status = updatedItem.stock <= updatedItem.minStock ? (updatedItem.stock === 0 ? 'critical' : 'warning') : 'ok';
    await db.update('inventory', id, updatedItem);
    setInventory(prev => prev.map(i => i.id === id ? updatedItem : i));
    if (tenantId && isValidUUID(tenantId)) {
        supabase.from('inventory').update({
            name: updatedItem.name,
            category: updatedItem.category,
            stock: updatedItem.stock,
            unit: updatedItem.unit,
            min_stock: updatedItem.minStock,
            cost_price: updatedItem.costPrice,
            status: updatedItem.status
        }).eq('id', id);
    }
  };
  const deleteInventoryItem = async (id: number) => {
    await db.delete('inventory', id);
    setInventory(prev => prev.filter(i => i.id !== id));
    if (tenantId && isValidUUID(tenantId)) supabase.from('inventory').delete().eq('id', id);
  };
  const toggleTheme = () => { const t = theme === 'dark' ? 'light' : 'dark'; setTheme(t); updateCompanySettings({ preferences: { ...companySettings.preferences, theme: t } }); };
  const generateReminders = async (os: WorkOrder) => {
      const service = services.find(s => s.name === os.service || s.id === os.serviceId);
      if (service && service.returnIntervalDays && service.returnIntervalDays > 0) {
          const dueDate = addDays(new Date(), service.returnIntervalDays).toISOString();
          const reminder: Reminder = {
              id: `rem-${Date.now()}`,
              clientId: os.clientId,
              vehicleId: 'v1', 
              serviceType: `Retorno: ${os.service}`,
              dueDate: dueDate,
              status: 'pending',
              createdAt: new Date().toISOString(),
              autoGenerated: true,
              tenant_id: tenantId
          };
          await db.create('reminders', reminder);
          setReminders(prev => [...prev, reminder]);
          if (tenantId && isValidUUID(tenantId)) {
              supabase.from('reminders').insert({
                  id: reminder.id,
                  tenant_id: tenantId,
                  client_id: reminder.clientId,
                  service_type: reminder.serviceType,
                  due_date: reminder.dueDate,
                  status: 'pending',
                  auto_generated: true
              });
          }
      }
  };
  const addService = async (service: Partial<ServiceCatalogItem>) => {
      const newService = { ...service, tenant_id: tenantId } as ServiceCatalogItem;
      // Ensure ID is set (use UUID if not present)
      if (!newService.id) {
          newService.id = generateUUID();
      }
      const saved = await db.create('services', newService);
      setServices(prev => [...prev, saved]);
      const newEntries: PriceMatrixEntry[] = [];
      Object.keys(VEHICLE_SIZES).forEach(size => {
          newEntries.push({ serviceId: saved.id, size: size as VehicleSize, price: 0 });
      });
      setPriceMatrix(prev => [...prev, ...newEntries]);
      if (tenantId && isValidUUID(tenantId)) {
          supabase.from('services').insert({
              id: saved.id,
              tenant_id: tenantId,
              name: saved.name,
              category: saved.category,
              description: saved.description,
              standard_time: saved.standardTimeMinutes,
              active: saved.active,
              return_interval_days: saved.returnIntervalDays,
              show_on_landing_page: saved.showOnLandingPage,
              image_url: saved.imageUrl,
              price_matrix: { prices: {}, consumption: [] }
          });
      }
  };
  const updateService = async (id: string, updates: Partial<ServiceCatalogItem>) => {
      const updated = await db.update('services', id, updates);
      if (updated) {
          setServices(prev => prev.map(s => s.id === id ? updated : s));
          if (tenantId && isValidUUID(tenantId) && isValidUUID(id)) {
              supabase.from('services').update({
                  name: updated.name,
                  category: updated.category,
                  description: updated.description,
                  standard_time: updated.standardTimeMinutes,
                  active: updated.active,
                  return_interval_days: updated.returnIntervalDays,
                  show_on_landing_page: updated.showOnLandingPage,
                  image_url: updated.imageUrl
              }).eq('id', id);
          }
      }
  };
  const deleteService = async (id: string) => {
      await db.delete('services', id);
      setServices(prev => prev.filter(s => s.id !== id));
      setPriceMatrix(prev => prev.filter(p => p.serviceId !== id));
      if (tenantId && isValidUUID(tenantId) && isValidUUID(id)) supabase.from('services').delete().eq('id', id);
  };
  const updatePrice = async (serviceId: string, size: VehicleSize, newPrice: number) => {
      // 1. Update Price Matrix
      setPriceMatrix(prev => {
          const existing = prev.find(p => p.serviceId === serviceId && p.size === size);
          if (existing) {
              return prev.map(p => p.serviceId === serviceId && p.size === size ? { ...p, price: newPrice } : p);
          } else {
              return [...prev, { serviceId, size, price: newPrice }];
          }
      });
      // 2. Update Service State & DB
      // We must check if service exists in current state or ref
      const service = servicesRef.current.find(s => s.id === serviceId);
      if (service) {
          // Construct new prices object
          const currentPrices = { ...service.price_matrix?.prices };
          currentPrices[size] = newPrice;
          const updatedService = {
              ...service,
              price_matrix: {
                  ...service.price_matrix,
                  prices: currentPrices
              }
          };
          // Update local state immediately
          setServices(prev => prev.map(s => s.id === serviceId ? updatedService : s));
          // Update Local DB
          await db.update('services', serviceId, { price_matrix: { ...service.price_matrix, prices: currentPrices } } as any);
          // Update Remote DB
          if (tenantId && isValidUUID(tenantId) && isValidUUID(serviceId)) {
              supabase.from('services').update({
                  price_matrix: { 
                      prices: currentPrices, 
                      consumption: getServiceConsumption(serviceId)?.items || [] 
                  }
              }).eq('id', serviceId);
          }
      }
  };
  const updateServiceInterval = (serviceId: string, days: number) => {
      updateService(serviceId, { returnIntervalDays: days });
  };
  const bulkUpdatePrices = async (targetSize: VehicleSize | 'all', percentage: number) => {
      // USE REF TO ENSURE WE HAVE LATEST STATE
      const currentMatrix = priceMatrixRef.current;
      // 1. Calculate new matrix
      const newMatrix = currentMatrix.map(p => {
          if (targetSize === 'all' || p.size === targetSize) {
              const newPriceRaw = p.price * (1 + percentage / 100);
              // Round to 2 decimal places
              const newPrice = Math.round((newPriceRaw + Number.EPSILON) * 100) / 100;
              return { ...p, price: newPrice };
          }
          return p;
      });
      // 2. Update UI State
      setPriceMatrix(newMatrix);
      // 3. Update Services State & Persist to Supabase
      const affectedServiceIds = new Set<string>();
      newMatrix.forEach(p => {
          if (targetSize === 'all' || p.size === targetSize) {
              affectedServiceIds.add(p.serviceId);
          }
      });
      // Update local services state to match
      const updatedServices = servicesRef.current.map(service => {
          if (affectedServiceIds.has(service.id)) {
              const servicePrices = newMatrix.filter(p => p.serviceId === service.id);
              const pricesObj: Record<string, number> = {};
              servicePrices.forEach(p => pricesObj[p.size] = p.price);
              // Update Local DB
              db.update('services', service.id, { price_matrix: { ...service.price_matrix, prices: pricesObj } } as any);
              // Optimistic DB Update - WITH UUID CHECK
              if (tenantId && isValidUUID(tenantId) && isValidUUID(service.id)) {
                  supabase.from('services').update({
                      price_matrix: { 
                          prices: pricesObj, 
                          consumption: getServiceConsumption(service.id)?.items || [] 
                      }
                  }).eq('id', service.id).then(({ error }) => {
                      if (error) console.error(`Error updating service ${service.id}`, error);
                  });
              } else {
                  console.warn(`Skipping Supabase update for non-UUID service: ${service.id}`);
              }
              return {
                  ...service,
                  price_matrix: {
                      ...service.price_matrix,
                      prices: pricesObj
                  }
              };
          }
          return service;
      });
      setServices(updatedServices);
  };
  const getPrice = (serviceId: string, size: VehicleSize) => {
      return priceMatrix.find(p => p.serviceId === serviceId && p.size === size)?.price || 0;
  };
  // ... (Rest of functions: updateServiceConsumption, addEmployee, etc. - same as before)
  const updateServiceConsumption = async (consumption: ServiceConsumption) => {
      const existingIndex = serviceConsumptions.findIndex(sc => sc.serviceId === consumption.serviceId);
      let newConsumptions = [...serviceConsumptions];
      if (existingIndex >= 0) {
          newConsumptions[existingIndex] = consumption;
      } else {
          newConsumptions.push(consumption);
      }
      setServiceConsumptions(newConsumptions);
      const service = services.find(s => s.id === consumption.serviceId);
      if (service) {
          await db.update('services', service.id, { price_matrix: { ...service.price_matrix, consumption: consumption.items } } as any);
          if (tenantId && isValidUUID(tenantId) && isValidUUID(service.id)) {
              const currentPrices: Record<string, number> = {};
              priceMatrix.filter(p => p.serviceId === service.id).forEach(p => currentPrices[p.size] = p.price);
              await supabase.from('services').update({
                  price_matrix: { 
                      prices: currentPrices, 
                      consumption: consumption.items 
                  }
              }).eq('id', service.id);
          }
      }
      return true;
  };
  // ... (Keep remaining functions: addEmployee, updateEmployee, deleteEmployee, assignTask, startTask, stopTask, addEmployeeTransaction, etc.)
  const addEmployee = async (employee: Omit<Employee, 'id' | 'balance'>) => {
      const newEmp = { ...employee, id: `emp-${Date.now()}`, balance: 0, tenant_id: tenantId } as Employee;
      const saved = await db.create('employees', newEmp);
      setEmployees(prev => [...prev, saved]);
      if (tenantId && isValidUUID(tenantId)) {
          supabase.from('employees').insert({
              id: saved.id,
              tenant_id: tenantId,
              name: saved.name,
              role: saved.role,
              pin: saved.pin,
              active: saved.active,
              balance: 0,
              salary_data: {
                  salaryType: saved.salaryType,
                  fixedSalary: saved.fixedSalary,
                  commissionRate: saved.commissionRate,
                  commissionBase: saved.commissionBase
              }
          });
      }
  };
  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
      const updated = await db.update('employees', id, updates);
      if (updated) {
          setEmployees(prev => prev.map(e => e.id === id ? updated : e));
          if (tenantId && isValidUUID(tenantId)) {
              const payload: any = {
                  name: updated.name,
                  role: updated.role,
                  pin: updated.pin,
                  active: updated.active,
                  balance: updated.balance
              };
              if (updates.salaryType || updates.fixedSalary || updates.commissionRate) {
                  payload.salary_data = {
                      salaryType: updated.salaryType,
                      fixedSalary: updated.fixedSalary,
                      commissionRate: updated.commissionRate,
                      commissionBase: updated.commissionBase
                  };
              }
              supabase.from('employees').update(payload).eq('id', id);
          }
      }
  };
  const deleteEmployee = async (id: string) => {
      await db.delete('employees', id);
      setEmployees(prev => prev.filter(e => e.id !== id));
      if (tenantId && isValidUUID(tenantId)) supabase.from('employees').delete().eq('id', id);
  };
  const assignTask = (workOrderId: string, serviceId: string, employeeId: string) => {};
  const startTask = (taskId: string) => {};
  const stopTask = (taskId: string) => {};
  const addEmployeeTransaction = async (trans: EmployeeTransaction) => {
      const newTrans = { ...trans, tenant_id: tenantId };
      const saved = await db.create('employee_transactions', newTrans);
      setEmployeeTransactions(prev => [...prev, saved]);
      const employee = employees.find(e => e.id === trans.employeeId);
      if (employee) {
          const newBalance = employee.balance + (trans.type === 'payment' || trans.type === 'advance' ? -trans.amount : trans.amount);
          updateEmployee(employee.id, { balance: newBalance });
      }
      if (tenantId && isValidUUID(tenantId)) {
          supabase.from('employee_transactions').insert({
              id: saved.id,
              tenant_id: tenantId,
              employee_id: saved.employeeId,
              type: saved.type,
              amount: saved.amount,
              description: saved.description,
              date: saved.date,
              related_work_order_id: saved.relatedWorkOrderId
          });
      }
  };
  const updateEmployeeTransaction = async (id: string, updates: Partial<EmployeeTransaction>) => {
      const oldTrans = employeeTransactions.find(t => t.id === id);
      if (!oldTrans) return;
      const updated = await db.update('employee_transactions', id, updates);
      if (updated) {
          setEmployeeTransactions(prev => prev.map(t => t.id === id ? updated : t));
          const employee = employees.find(e => e.id === updated.employeeId);
          if (employee) {
              const oldEffect = oldTrans.type === 'payment' || oldTrans.type === 'advance' ? -oldTrans.amount : oldTrans.amount;
              const newEffect = updated.type === 'payment' || updated.type === 'advance' ? -updated.amount : updated.amount;
              const newBalance = employee.balance - oldEffect + newEffect;
              updateEmployee(employee.id, { balance: newBalance });
          }
          if (tenantId && isValidUUID(tenantId)) {
              supabase.from('employee_transactions').update({
                  amount: updated.amount,
                  description: updated.description,
                  date: updated.date,
                  type: updated.type
              }).eq('id', id);
          }
      }
  };
  const deleteEmployeeTransaction = async (id: string) => {
      const trans = employeeTransactions.find(t => t.id === id);
      if (trans) {
          await db.delete('employee_transactions', id);
          setEmployeeTransactions(prev => prev.filter(t => t.id !== id));
          const employee = employees.find(e => e.id === trans.employeeId);
          if (employee) {
              const effect = trans.type === 'payment' || trans.type === 'advance' ? -trans.amount : trans.amount;
              updateEmployee(employee.id, { balance: employee.balance - effect });
          }
          if (tenantId && isValidUUID(tenantId)) supabase.from('employee_transactions').delete().eq('id', id);
      }
  };
  const addFinancialTransaction = async (trans: FinancialTransaction) => {
      const newTrans = { ...trans, tenant_id: tenantId };
      const saved = await db.create('financial_transactions', newTrans);
      setFinancialTransactions(prev => [...prev, saved]);
      if (tenantId && isValidUUID(tenantId)) {
          supabase.from('financial_transactions').insert({
              tenant_id: tenantId,
              description: saved.desc,
              category: saved.category,
              amount: saved.amount,
              type: saved.type,
              date: saved.date,
              method: saved.method,
              status: saved.status
          });
      }
  };
  const updateFinancialTransaction = async (id: number, updates: Partial<FinancialTransaction>) => {
      const updated = await db.update('financial_transactions', id, updates);
      if (updated) {
          setFinancialTransactions(prev => prev.map(t => t.id === id ? updated : t));
      }
  };
  const deleteFinancialTransaction = async (id: number) => {
      await db.delete('financial_transactions', id);
      setFinancialTransactions(prev => prev.filter(t => t.id !== id));
  };
  const createCampaign = async (campaign: MarketingCampaign) => {
      const newCmp = { ...campaign, tenant_id: tenantId };
      const saved = await db.create('marketing_campaigns', newCmp);
      setCampaigns(prev => [...prev, saved]);
      if (tenantId && isValidUUID(tenantId)) {
          supabase.from('marketing_campaigns').insert({
              id: saved.id,
              tenant_id: tenantId,
              name: saved.name,
              target_segment: saved.targetSegment,
              message_template: saved.messageTemplate,
              sent_count: saved.sentCount,
              conversion_count: saved.conversionCount,
              revenue_generated: saved.revenueGenerated,
              cost_in_tokens: saved.costInTokens,
              status: saved.status,
              date: saved.date
          });
      }
  };
  const updateCampaign = async (id: string, updates: Partial<MarketingCampaign>) => {
      const updated = await db.update('marketing_campaigns', id, updates);
      if (updated) {
          setCampaigns(prev => prev.map(c => c.id === id ? updated : c));
          if (tenantId && isValidUUID(tenantId)) {
              supabase.from('marketing_campaigns').update({
                  name: updated.name,
                  status: updated.status,
                  sent_count: updated.sentCount,
                  conversion_count: updated.conversionCount,
                  revenue_generated: updated.revenueGenerated
              }).eq('id', id);
          }
      }
  };
  const deleteCampaign = async (id: string) => {
      await db.delete('marketing_campaigns', id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      if (tenantId && isValidUUID(tenantId)) supabase.from('marketing_campaigns').delete().eq('id', id);
  };
  const seedDefaultCampaigns = async () => {};
  const seedMockReviews = async () => {};
  const createSocialPost = (post: SocialPost) => {
      setSocialPosts(prev => [...prev, post]);
  };
  const generateSocialContent = async (workOrder: WorkOrder) => {
      return { caption: `Confira o resultado incrível neste ${workOrder.vehicle}! ✨`, hashtags: ['#detailing', '#esteticaautomotiva'] };
  };
  const addPointsToClient = async (clientId: string, workOrderId: string, points: number, description: string) => {
      let clientPoint = clientPoints.find(cp => cp.clientId === clientId);
      if (!clientPoint) {
          clientPoint = {
              clientId,
              totalPoints: 0,
              currentLevel: 1,
              tier: 'bronze',
              lastServiceDate: new Date().toISOString(),
              servicesCompleted: 0,
              pointsHistory: []
          };
      }
      const newTotal = clientPoint.totalPoints + points;
      let newTier: TierLevel = 'bronze';
      const tiers = companySettings.gamification?.tiers || defaultTiers;
      for (const t of tiers) {
          if (newTotal >= t.minPoints) newTier = t.id;
      }
      const newHistory = {
          id: `ph-${Date.now()}`,
          workOrderId,
          points,
          description,
          date: new Date().toISOString(),
          type: 'earn',
          tenant_id: tenantId,
          clientId
      };
      const updatedPoint = {
          ...clientPoint,
          totalPoints: newTotal,
          tier: newTier,
          lastServiceDate: new Date().toISOString(),
          servicesCompleted: clientPoint.servicesCompleted + 1,
          pointsHistory: [...clientPoint.pointsHistory, newHistory]
      };
      await db.create('points_history', newHistory);
      setClientPoints(prev => {
          const idx = prev.findIndex(cp => cp.clientId === clientId);
          if (idx >= 0) {
              const newArr = [...prev];
              newArr[idx] = updatedPoint;
              return newArr;
          }
          return [...prev, updatedPoint];
      });
      if (tenantId && isValidUUID(tenantId)) {
          supabase.from('points_history').insert({
              tenant_id: tenantId,
              client_id: clientId,
              points: points,
              description: description,
              type: 'earn'
          });
      }
  };
  const createFidelityCard = async (clientId: string) => {
      const newCard: FidelityCard = {
          clientId,
          cardNumber: Math.random().toString().slice(2, 18),
          cardHolder: '',
          cardColor: 'black',
          qrCode: '',
          expiresAt: addDays(new Date(), 365).toISOString(),
          issueDate: new Date().toISOString()
      };
      await db.create('fidelity_cards', { ...newCard, id: `fc-${Date.now()}`, tenant_id: tenantId });
      setFidelityCards(prev => [...prev, newCard]);
      if (tenantId && isValidUUID(tenantId)) {
          supabase.from('fidelity_cards').insert({
              tenant_id: tenantId,
              client_id: clientId,
              card_number: newCard.cardNumber
          });
      }
      return newCard;
  };
  const addReward = async (reward: Omit<Reward, 'id' | 'createdAt'>) => {
      const newReward = { ...reward, id: `rew-${Date.now()}`, createdAt: new Date().toISOString(), tenant_id: tenantId } as Reward;
      await db.create('rewards', newReward);
      setRewards(prev => [...prev, newReward]);
      if (tenantId && isValidUUID(tenantId)) {
          supabase.from('rewards').insert({
              id: newReward.id,
              tenant_id: tenantId,
              name: newReward.name,
              description: newReward.description,
              required_points: newReward.requiredPoints,
              required_level: newReward.requiredLevel,
              reward_type: newReward.rewardType,
              config: newReward.config,
              active: newReward.active
          });
      }
  };
  const updateReward = async (id: string, updates: Partial<Reward>) => {
      const updated = await db.update('rewards', id, updates);
      if (updated) {
          setRewards(prev => prev.map(r => r.id === id ? updated : r));
          if (tenantId && isValidUUID(tenantId)) {
              supabase.from('rewards').update({
                  name: updated.name,
                  description: updated.description,
                  required_points: updated.requiredPoints,
                  active: updated.active,
                  config: updated.config
              }).eq('id', id);
          }
      }
  };
  const deleteReward = async (id: string) => {
      await db.delete('rewards', id);
      setRewards(prev => prev.filter(r => r.id !== id));
      if (tenantId && isValidUUID(tenantId)) supabase.from('rewards').delete().eq('id', id);
  };
  const getRewardsByLevel = (level: TierLevel) => {
      const levels = ['bronze', 'silver', 'gold', 'platinum'];
      const userLevelIdx = levels.indexOf(level);
      return rewards.filter(r => levels.indexOf(r.requiredLevel) <= userLevelIdx && r.active);
  };
  const updateTierConfig = (tiers: TierConfig[]) => {
      updateCompanySettings({ gamification: { ...companySettings.gamification, tiers } });
  };
  const claimReward = (clientId: string, rewardId: string) => {
      const reward = rewards.find(r => r.id === rewardId);
      const points = clientPoints.find(cp => cp.clientId === clientId);
      if (!reward || !points) return { success: false, message: 'Dados inválidos' };
      if (points.totalPoints < reward.requiredPoints) return { success: false, message: 'Pontos insuficientes' };
      const newTotal = points.totalPoints - reward.requiredPoints;
      const redemption: Redemption = {
          id: `red-${Date.now()}`,
          clientId,
          rewardId,
          rewardName: reward.name,
          code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          pointsCost: reward.requiredPoints,
          status: 'active',
          redeemedAt: new Date().toISOString(),
          tenant_id: tenantId
      };
      db.create('redemptions', redemption);
      setRedemptions(prev => [...prev, redemption]);
      const historyEntry = {
          id: `ph-${Date.now()}`,
          workOrderId: '',
          points: -reward.requiredPoints,
          description: `Resgate: ${reward.name}`,
          date: new Date().toISOString(),
          type: 'redemption',
          tenant_id: tenantId,
          clientId
      };
      db.create('points_history', historyEntry);
      setClientPoints(prev => prev.map(cp => cp.clientId === clientId ? { 
          ...cp, 
          totalPoints: newTotal,
          pointsHistory: [...cp.pointsHistory, historyEntry as any]
      } : cp));
      if (tenantId && isValidUUID(tenantId)) {
          supabase.from('redemptions').insert({
              id: redemption.id,
              tenant_id: tenantId,
              client_id: clientId,
              reward_id: rewardId,
              reward_name: reward.name,
              code: redemption.code,
              points_cost: redemption.pointsCost,
              status: 'active',
              redeemed_at: redemption.redeemedAt
          });
          supabase.from('points_history').insert({
              tenant_id: tenantId,
              client_id: clientId,
              points: -reward.requiredPoints,
              description: historyEntry.description,
              type: 'redemption'
          });
      }
      return { success: true, message: 'Recompensa resgatada com sucesso!', voucherCode: redemption.code };
  };
  const useVoucher = (code: string, workOrderId: string) => {
      const redemption = redemptions.find(r => r.code === code && r.status === 'active');
      if (!redemption) return false;
      const updated = { ...redemption, status: 'used' as const, usedAt: new Date().toISOString(), usedInWorkOrderId: workOrderId };
      db.update('redemptions', redemption.id, updated);
      setRedemptions(prev => prev.map(r => r.id === redemption.id ? updated : r));
      if (tenantId && isValidUUID(tenantId)) {
          supabase.from('redemptions').update({
              status: 'used',
              used_at: updated.usedAt,
              used_in_work_order_id: workOrderId
          }).eq('id', redemption.id);
      }
      return true;
  };
  const getVoucherDetails = (code: string) => {
      const redemption = redemptions.find(r => r.code === code);
      if (!redemption) return null;
      const reward = rewards.find(r => r.id === redemption.rewardId);
      return { redemption, reward };
  };
  const generatePKPass = (clientId: string) => {
      return `https://example.com/pkpass/${clientId}`; // Mock
  };
  const generateGoogleWallet = (clientId: string) => {
      return `https://wallet.google.com/pass/${clientId}`; // Mock
  };
  const seedDefaultRewards = async () => {
      // Implementation
  };
  return (
    <AppContext.Provider value={{
      inventory, workOrders, clients, recipes, reminders, services, priceMatrix, employees, employeeTransactions,
      financialTransactions, clientPoints, fidelityCards, rewards, redemptions, serviceConsumptions,
      currentUser, ownerUser, tenantId, isAppLoading, theme, campaigns, socialPosts, notifications, systemAlerts,
      companySettings, subscription, messageLogs,
      markNotificationAsRead, clearAllNotifications, addNotification, markAlertResolved,
      updateCompanySettings, checkPermission, checkLimit, planLimits, buyTokens, consumeTokens, changePlan, cancelSubscription,
      forceSyncToCloud, connectWhatsapp, disconnectWhatsapp, simulateWhatsappScan,
      login: (pin) => { const e = employees.find(emp => emp.pin === pin && emp.active); if(e) { setCurrentUser(e); return true; } return false; },
      logout: () => setCurrentUser(null),
      loginOwner, registerOwner, logoutOwner, updateOwner, createTenant: registerOwner, reloadUserData,
      addWorkOrder, updateWorkOrder, completeWorkOrder, 
      recalculateClientMetrics, updateClientLTV, updateClientVisits, submitNPS,
      addClient, updateClient, deleteClient,
      addVehicle, updateVehicle, removeVehicle,
      addInventoryItem, updateInventoryItem, deleteInventoryItem, deductStock,
      toggleTheme: () => { const t = theme === 'dark' ? 'light' : 'dark'; setTheme(t); updateCompanySettings({ preferences: { ...companySettings.preferences, theme: t } }); },
      generateReminders,
      addService, updateService, deleteService, updatePrice, updateServiceInterval, bulkUpdatePrices, getPrice,
      updateServiceConsumption, getServiceConsumption, calculateServiceCost,
      addEmployee, updateEmployee, deleteEmployee, assignTask, startTask, stopTask,
      addEmployeeTransaction, updateEmployeeTransaction, deleteEmployeeTransaction,
      addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction,
      createCampaign, updateCampaign, deleteCampaign, seedDefaultCampaigns, seedMockReviews, getWhatsappLink: (p, m) => `https://wa.me/${p.replace(/\D/g, '')}?text=${encodeURIComponent(m)}`,
      createSocialPost, generateSocialContent,
      addPointsToClient, getClientPoints: (id) => clientPoints.find(cp => cp.clientId === id), createFidelityCard, getFidelityCard: (id) => fidelityCards.find(fc => fc.clientId === id),
      addReward, updateReward, deleteReward, getRewardsByLevel: (level) => rewards.filter(r => r.requiredLevel === level && r.active), updateTierConfig, claimReward, getClientRedemptions: (id) => redemptions.filter(r => r.clientId === id), useVoucher, getVoucherDetails,
      generatePKPass, generateGoogleWallet,
      seedDefaultRewards
    }}>
      {children}
    </AppContext.Provider>
  );
}
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
