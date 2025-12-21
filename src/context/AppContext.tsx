import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { 
  Client, InventoryItem, WorkOrder, ServiceRecipe, Reminder, Vehicle, 
  ServiceCatalogItem, PriceMatrixEntry, VehicleSize, Employee, Task, 
  EmployeeTransaction, MarketingCampaign,
  CompanySettings, SubscriptionDetails, FinancialTransaction, ClientPoints, FidelityCard, Reward,
  Redemption, TierConfig, TierLevel, ShopOwner, Notification, ServiceConsumption, AuthResponse,
  SystemAlert, SocialPost, CustomAutomation, MessageLog
} from '../types';
import { addDays, formatISO, differenceInDays } from 'date-fns';
import { db } from '../lib/db';
import { formatId } from '../lib/utils';
import { MOCK_ALERTS } from '../lib/mockData';
import { whatsappService } from '../services/whatsapp';

// Define defaultTiers before usage
const defaultTiers: TierConfig[] = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, color: 'from-amber-500 to-amber-600', benefits: ['5% de desconto'] },
  { id: 'silver', name: 'Prata', minPoints: 1000, color: 'from-slate-400 to-slate-600', benefits: ['10% de desconto', 'Frete grátis'] },
  { id: 'gold', name: 'Ouro', minPoints: 3000, color: 'from-yellow-500 to-yellow-600', benefits: ['15% de desconto', 'Atendimento prioritário'] },
  { id: 'platinum', name: 'Platina', minPoints: 5000, color: 'from-blue-500 to-blue-600', benefits: ['20% de desconto', 'Brinde exclusivo'] }
];

// PLAN CONFIGURATIONS
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
      termsText: `TERMOS DE USO E PRESTAÇÃO DE SERVIÇOS...`,
      privacyText: `POLÍTICA DE PRIVACIDADE...`
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
  
  // Subscription & Permissions
  checkPermission: (feature: string) => boolean;
  checkLimit: (resource: 'employees', currentCount: number) => boolean;
  planLimits: { maxEmployees: number };
  
  buyTokens: (amount: number, cost: number) => void;
  consumeTokens: (amount: number, description: string, context?: { clientId?: string, phone?: string, message?: string }) => boolean;
  changePlan: (planId: 'starter' | 'pro' | 'enterprise' | 'trial') => void;
  cancelSubscription: () => Promise<void>;

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
  updatePrice: (serviceId: string, size: VehicleSize, newPrice: number) => void;
  updateServiceInterval: (serviceId: string, days: number) => void;
  bulkUpdatePrices: (targetSize: VehicleSize | 'all', percentage: number) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
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

  // --- THEME EFFECT ---
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // --- PERMISSION & LIMITS LOGIC ---
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

  // --- NOTIFICATION SEEDING ---
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
                },
                {
                    id: 'n2',
                    type: 'warning',
                    title: 'Dica de Configuração',
                    message: 'Acesse Configurações > Integrações para conectar seu WhatsApp.',
                    read: false,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
                },
                {
                    id: 'n3',
                    type: 'success',
                    title: 'Sistema Atualizado',
                    message: 'Novas funcionalidades de CRM e Financeiro disponíveis.',
                    read: true,
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
                }
            ]);
        }
    }, 1500); // Small delay to simulate incoming
    return () => clearTimeout(timer);
  }, []);

  // --- INITIAL LOAD ---
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
      const tenants = await db.getAll<any>('tenants');
      const tenant = tenants.find(t => t.owner_id === userId);

      if (tenant) {
        setTenantId(tenant.id);
        const settings = { 
            ...initialCompanySettings, 
            ...(tenant.settings || {}),
            whatsapp: {
                ...initialCompanySettings.whatsapp,
                ...(tenant.settings?.whatsapp || {}),
                templates: {
                    ...initialCompanySettings.whatsapp.templates,
                    ...(tenant.settings?.whatsapp?.templates || {})
                }
            },
            automations: {
                ...initialCompanySettings.automations,
                ...(tenant.settings?.automations || {})
            },
            customAutomations: tenant.settings?.customAutomations || [],
            legal: {
                ...initialCompanySettings.legal,
                ...(tenant.settings?.legal || {})
            }
        };
        
        setCompanySettings(settings);
        
        // Load Theme from Settings
        if (settings.preferences?.theme) {
            setTheme(settings.preferences.theme);
        }

        setSubscription({ ...initialSubscription, ...(tenant.subscription || {}) });

        const [
          clientsData, wosData, invData, servicesData, empData, finData,
          rewardsData, redemptionsData, cardsData, historyData, campaignsData, alertsData, remindersData, empTransData,
          msgLogsData
        ] = await Promise.all([
          db.getAll<any>('clients'),
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

        setClients(clientsData.map(c => ({ ...c, vehicles: c.vehicles || [] })));
        setWorkOrders(wosData.map(o => ({ ...o, ...o.json_data })));
        setInventory(invData);
        setReminders(remindersData);
        
        const mappedServices = servicesData.map(s => ({ ...s, ...s.price_matrix }));
        setServices(mappedServices);
        
        const matrix: PriceMatrixEntry[] = [];
        const consumptions: ServiceConsumption[] = [];
        servicesData.forEach(s => {
          const prices = s.price_matrix?.prices || {};
          Object.entries(prices).forEach(([size, price]) => {
            matrix.push({ serviceId: s.id, size: size as VehicleSize, price: Number(price) });
          });
          if (s.price_matrix?.consumption) {
            consumptions.push({ serviceId: s.id, items: s.price_matrix.consumption });
          }
        });
        setPriceMatrix(matrix);
        setServiceConsumptions(consumptions);

        setEmployees(empData.map(e => ({ ...e, ...e.salary_data })));
        setEmployeeTransactions(empTransData);
        setFinancialTransactions(finData);
        setRewards(rewardsData.map(r => ({ ...r, ...r.config })));
        setRedemptions(redemptionsData);
        setFidelityCards(cardsData.map(c => ({
            ...c,
            clientId: c.client_id,
            cardNumber: c.card_number,
            cardHolder: '', 
            cardColor: 'blue',
            qrCode: '',
            expiresAt: '2030-01-01',
            issueDate: c.created_at
        })));
        setPointsHistory(historyData);
        setCampaigns(campaignsData.map(c => ({
            ...c,
            targetSegment: c.target_segment,
            message_template: c.message_template,
            sentCount: c.sent_count,
            conversionCount: c.conversion_count,
            revenueGenerated: c.revenue_generated,
            cost_in_tokens: c.cost_in_tokens
        })));
        setMessageLogs(msgLogsData);

        let currentAlerts = alertsData;
        if (currentAlerts.length === 0) {
            const seededAlerts = [];
            for (const alert of MOCK_ALERTS) {
                const newAlert = await db.create('alerts', { ...alert, tenant_id: tenant.id });
                seededAlerts.push(newAlert);
            }
            currentAlerts = seededAlerts;
        }

        setSystemAlerts(currentAlerts.map(a => ({
            ...a,
            actionLink: a.action_link,
            actionLabel: a.action_label,
            createdAt: a.created_at,
            financialImpact: a.financial_impact
        })));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsAppLoading(false);
    }
  };

  const loginOwner = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const user = await db.findUserByEmail(email);
      if (user && user.password === password) {
        const userData = { id: user.id, name: user.name, email: user.email, shopName: user.shopName };
        setOwnerUser(userData);
        localStorage.setItem('cristal_care_user', JSON.stringify(userData));
        await loadTenantData(user.id);
        return { success: true };
      }
      return { success: false, error: { message: 'Credenciais inválidas' } };
    } catch (e) {
      return { success: false, error: { message: 'Erro no login' } };
    }
  };

  const registerOwner = async (name: string, email: string, shopName: string, password: string) => {
    try {
      const existing = await db.findUserByEmail(email);
      if (existing) return { success: false, error: 'Email já cadastrado' };

      const newUser = await db.create('users', { name, email, password, shopName });
      
      const slug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await db.create('tenants', {
        name: shopName,
        slug,
        owner_id: newUser.id,
        plan_id: 'trial',
        status: 'active',
        settings: { ...initialCompanySettings, name: shopName, slug },
        subscription: initialSubscription
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: 'Erro ao registrar' };
    }
  };

  const logoutOwner = async () => {
    setOwnerUser(null);
    setTenantId(null);
    localStorage.removeItem('cristal_care_user');
    setClients([]);
    setWorkOrders([]);
  };

  const updateOwner = async (updates: { name?: string; email?: string; password?: string }) => {
    if (!ownerUser) return false;
    
    try {
        // Update DB
        await db.update('users', ownerUser.id, updates);
        
        // Update State (excluding password for security in state, though it's in DB)
        const { password, ...safeUpdates } = updates;
        const updatedUser = { ...ownerUser, ...safeUpdates };
        setOwnerUser(updatedUser);
        localStorage.setItem('cristal_care_user', JSON.stringify(updatedUser));
        
        return true;
    } catch (error) {
        console.error("Error updating owner:", error);
        return false;
    }
  };

  const updateCompanySettings = async (settings: Partial<CompanySettings>) => {
    if (!tenantId) return;
    const newSettings = { ...companySettings, ...settings };
    setCompanySettings(newSettings);
    await db.update('tenants', tenantId, { settings: newSettings });
  };

  const toggleTheme = () => {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      // Persist preference
      updateCompanySettings({
          preferences: {
              ...companySettings.preferences,
              theme: newTheme
          }
      });
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

  // --- NOTIFICATIONS ---
  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
      const newNotif: Notification = {
          id: `notif-${Date.now()}`,
          ...notification,
          read: false,
          createdAt: new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // --- WHATSAPP LOGIC ---
  const connectWhatsapp = async () => {
    const { qrCode, pairingCode } = await whatsappService.startSession();
    updateCompanySettings({
      whatsapp: { ...companySettings.whatsapp, session: { status: 'scanning', qrCode, pairingCode } }
    });
  };

  const simulateWhatsappScan = async () => {
    updateCompanySettings({
      whatsapp: {
        ...companySettings.whatsapp,
        session: {
          status: 'connected',
          device: { name: 'iPhone 14 Pro', number: companySettings.phone, battery: 88, avatarUrl: companySettings.logoUrl, platform: 'ios' }
        }
      }
    });
  };

  const disconnectWhatsapp = async () => {
    await whatsappService.logout();
    updateCompanySettings({ whatsapp: { ...companySettings.whatsapp, session: { status: 'disconnected' } } });
  };

  const consumeTokens = (amount: number, description: string, context?: { clientId?: string, phone?: string, message?: string }) => {
    if (subscription.tokenBalance < amount) return false;
    const newBalance = subscription.tokenBalance - amount;
    const historyEntry = { id: `th-${Date.now()}`, type: 'debit' as const, amount, description, date: new Date().toISOString() };

    setSubscription(prev => ({ ...prev, tokenBalance: newBalance, tokenHistory: [historyEntry, ...prev.tokenHistory] }));

    if (tenantId) {
        db.update('tenants', tenantId, { subscription: { ...subscription, tokenBalance: newBalance, tokenHistory: [historyEntry, ...subscription.tokenHistory] } });
    }

    if (context && context.phone && context.message) {
        whatsappService.sendMessage(context.phone, context.message).then(async (res) => {
            const client = context.clientId ? clients.find(c => c.id === context.clientId) : null;
            const logEntry: MessageLog = {
                id: res.messageId,
                clientId: context.clientId,
                clientName: client?.name || 'Desconhecido',
                clientPhone: context.phone!,
                content: context.message!,
                type: 'text',
                status: 'sent',
                costInTokens: amount,
                sentAt: new Date().toISOString(),
                channel: 'whatsapp_bot',
                trigger: 'manual'
            };
            if (tenantId) {
                const savedLog = await db.create('message_logs', { ...logEntry, tenant_id: tenantId });
                setMessageLogs(prev => [savedLog as MessageLog, ...prev]);
                setTimeout(async () => {
                    const newStatus = await whatsappService.simulateDeliveryUpdate();
                    const updatedLog = { ...savedLog, status: newStatus, [newStatus === 'read' ? 'readAt' : 'deliveredAt']: new Date().toISOString() };
                    setMessageLogs(prev => prev.map(l => l.id === savedLog.id ? updatedLog : l));
                }, 5000);
            }
        });
    }
    return true;
  };

  const buyTokens = (amount: number, cost: number) => {
    const newBalance = subscription.tokenBalance + amount;
    const historyEntry = { id: `th-${Date.now()}`, type: 'credit' as const, amount, description: `Compra de Pacote`, date: new Date().toISOString() };
    setSubscription(prev => ({ ...prev, tokenBalance: newBalance, tokenHistory: [historyEntry, ...prev.tokenHistory] }));
    if (tenantId) {
        db.update('tenants', tenantId, { subscription: { ...subscription, tokenBalance: newBalance, tokenHistory: [historyEntry, ...subscription.tokenHistory] } });
    }
  };

  const changePlan = (planId: 'starter' | 'pro' | 'enterprise' | 'trial') => {
      // Set next billing date to 30 days from now (renewal/change date)
      const nextBilling = formatISO(addDays(new Date(), 30));
      
      setSubscription(prev => {
          const updatedSub = { 
              ...prev, 
              planId, 
              status: 'active' as const,
              nextBillingDate: nextBilling 
          };
          
          if (tenantId) {
              db.update('tenants', tenantId, { subscription: updatedSub });
          }
          return updatedSub;
      });
  };

  const cancelSubscription = async () => {
      if (!tenantId) return;
      const updatedSub = { ...subscription, status: 'inactive' as const };
      setSubscription(updatedSub);
      await db.update('tenants', tenantId, { subscription: updatedSub });
  };

  // --- CRUD OPERATIONS ---
  const addClient = async (client: Partial<Client>) => {
    if (!tenantId) return null;
    const newClient = await db.create('clients', { ...client, tenant_id: tenantId, vehicles: [] });
    setClients(prev => [...prev, newClient as Client]);
    return newClient as Client;
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    await db.update('clients', id, updates);
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteClient = async (id: string) => {
    await db.delete('clients', id);
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const addWorkOrder = async (os: WorkOrder) => {
    if (!tenantId) return false;
    const payload = {
      ...os,
      tenant_id: tenantId,
      client_id: os.clientId,
      vehicle_plate: os.plate,
      service_summary: os.service,
      total_value: os.totalValue,
      payment_status: os.paymentStatus,
      payment_method: os.paymentMethod,
      nps_score: os.npsScore,
      json_data: { ...os }
    };
    const newOS = await db.create('work_orders', payload);
    setWorkOrders(prev => [newOS as unknown as WorkOrder, ...prev]);
    return true;
  };

  const updateWorkOrder = async (id: string, updates: Partial<WorkOrder>) => {
    const current = workOrders.find(o => o.id === id);
    if (!current) return false;
    const merged = { ...current, ...updates };
    const payload = { ...updates, json_data: merged, status: updates.status, total_value: updates.totalValue };
    await db.update('work_orders', id, payload);
    setWorkOrders(prev => prev.map(o => o.id === id ? merged : o));
    
    // Notification Logic based on Preferences
    if (companySettings.preferences.notifications.osUpdates && updates.status && updates.status !== current.status) {
        addNotification({
            type: 'info',
            title: 'Atualização de Status',
            message: `A OS #${formatId(id)} mudou para: ${updates.status}`
        });
    }

    return true;
  };

  const updateCampaign = async (id: string, updates: Partial<MarketingCampaign>) => { 
      await db.update('marketing_campaigns', id, updates); 
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c)); 
  };

  const completeWorkOrder = (id: string, orderSnapshot?: WorkOrder) => {
      updateWorkOrder(id, { status: 'Concluído' });
      
      // Baixa de estoque automática
      const os = orderSnapshot || workOrders.find(o => o.id === id);
      if (os) {
          if (os.serviceId) deductStock(os.serviceId);
          if (os.serviceIds && os.serviceIds.length > 0) {
              os.serviceIds.forEach(sid => deductStock(sid));
          }

          // --- ATTRIBUTION LOGIC (CAMPAIGN REVENUE) ---
          if (os.campaignId) {
              const campaign = campaigns.find(c => c.id === os.campaignId);
              if (campaign) {
                  const newRevenue = (campaign.revenueGenerated || 0) + (os.totalValue || 0);
                  const newConversions = (campaign.conversionCount || 0) + 1;
                  
                  updateCampaign(campaign.id, {
                      revenueGenerated: newRevenue,
                      conversionCount: newConversions
                  });
                  
                  console.log(`[Attribution] OS #${os.id} linked to Campaign "${campaign.name}". Revenue: +${os.totalValue}`);
              }
          }
      }
  };

  // --- INVENTORY LOGIC ---
  const addInventoryItem = async (item: any) => { if (!tenantId) return; const newItem = await db.create('inventory', { ...item, tenant_id: tenantId, status: 'ok' }); setInventory(prev => [...prev, newItem as InventoryItem]); };
  const updateInventoryItem = async (id: number, updates: any) => { await db.update('inventory', id, updates); setInventory(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i)); };
  const deleteInventoryItem = async (id: number) => { await db.delete('inventory', id); setInventory(prev => prev.filter(i => i.id !== id)); };
  
  const deductStock = (serviceId: string) => {
      const consumption = serviceConsumptions.find(c => c.serviceId === serviceId);
      if (!consumption) return;

      consumption.items.forEach(item => {
          const invItem = inventory.find(i => i.id === item.inventoryId);
          if (invItem) {
              let quantityToDeduct = item.quantity;
              
              // Simple unit conversion handling (simplified)
              if (invItem.unit === 'L' && item.usageUnit === 'ml') quantityToDeduct = item.quantity / 1000;
              else if (invItem.unit === 'kg' && item.usageUnit === 'g') quantityToDeduct = item.quantity / 1000;
              else if (invItem.unit === 'ml' && item.usageUnit === 'L') quantityToDeduct = item.quantity * 1000;
              else if (invItem.unit === 'g' && item.usageUnit === 'kg') quantityToDeduct = item.quantity * 1000;
              
              const newStock = Math.max(0, invItem.stock - quantityToDeduct);
              let newStatus: 'ok' | 'warning' | 'critical' = 'ok';
              
              if (newStock <= invItem.minStock) newStatus = 'critical';
              else if (newStock <= invItem.minStock * 1.5) newStatus = 'warning';

              updateInventoryItem(invItem.id, { stock: newStock, status: newStatus });

              // Low Stock Notification
              if (newStatus === 'critical' && companySettings.preferences.notifications.lowStock) {
                  addNotification({
                      type: 'warning',
                      title: 'Estoque Crítico',
                      message: `O produto ${invItem.name} atingiu o nível crítico (${newStock.toFixed(1)} ${invItem.unit}).`
                  });
              }
          }
      });
  };

  // ... (Rest of methods: addService, etc. - Keeping existing) ...
  const addService = async (service: any) => { if (!tenantId) return; const newService = await db.create('services', { ...service, tenant_id: tenantId, price_matrix: { prices: {}, consumption: [], imageUrl: service.imageUrl, returnIntervalDays: service.returnIntervalDays } }); setServices(prev => [...prev, newService as ServiceCatalogItem]); };
  const updateService = async (id: string, updates: any) => { await db.update('services', id, updates); setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s)); };
  const deleteService = async (id: string) => { await db.delete('services', id); setServices(prev => prev.filter(s => s.id !== id)); };
  
  const addEmployee = async (employee: any) => { if (!tenantId) return; const newEmp = await db.create('employees', { ...employee, tenant_id: tenantId, salary_data: { ...employee } }); setEmployees(prev => [...prev, newEmp as Employee]); };
  const updateEmployee = async (id: string, updates: any) => { await db.update('employees', id, { ...updates, salary_data: updates }); setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e)); };
  const deleteEmployee = async (id: string) => { await db.delete('employees', id); setEmployees(prev => prev.filter(e => e.id !== id)); };
  
  const addEmployeeTransaction = async (trans: EmployeeTransaction) => { if (!tenantId) return; const newTrans = await db.create('employee_transactions', { ...trans, tenant_id: tenantId }); setEmployeeTransactions(prev => [newTrans as EmployeeTransaction, ...prev]); };
  const updateEmployeeTransaction = async (id: string, updates: Partial<EmployeeTransaction>) => { await db.update('employee_transactions', id, updates); setEmployeeTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t)); };
  const deleteEmployeeTransaction = async (id: string) => { await db.delete('employee_transactions', id); setEmployeeTransactions(prev => prev.filter(t => t.id !== id)); };
  
  const addFinancialTransaction = async (trans: any) => { if (!tenantId) return; const newTrans = await db.create('financial_transactions', { ...trans, tenant_id: tenantId }); setFinancialTransactions(prev => [newTrans as FinancialTransaction, ...prev]); };
  const updateFinancialTransaction = async (id: number, updates: any) => { await db.update('financial_transactions', id, updates); setFinancialTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t)); };
  const deleteFinancialTransaction = async (id: number) => { await db.delete('financial_transactions', id); setFinancialTransactions(prev => prev.filter(t => t.id !== id)); };

  const updatePrice = (serviceId: string, size: VehicleSize, newPrice: number) => { setPriceMatrix(prev => { const existing = prev.find(p => p.serviceId === serviceId && p.size === size); if (existing) return prev.map(p => p.serviceId === serviceId && p.size === size ? { ...p, price: newPrice } : p); return [...prev, { serviceId, size, price: newPrice }]; }); };
  
  const createCampaign = async (campaign: MarketingCampaign) => { if (!tenantId) return; const newCamp = await db.create('marketing_campaigns', { ...campaign, tenant_id: tenantId, target_segment: campaign.targetSegment, message_template: campaign.messageTemplate, sent_count: campaign.sentCount, cost_in_tokens: campaign.costInTokens }); setCampaigns(prev => [...prev, newCamp as unknown as MarketingCampaign]); };
  
  const deleteCampaign = async (id: string) => { await db.delete('marketing_campaigns', id); setCampaigns(prev => prev.filter(c => c.id !== id)); };

  const addPointsToClient = async (clientId: string, workOrderId: string, points: number, description: string) => { if (!tenantId) return; const entry = await db.create('points_history', { tenant_id: tenantId, client_id: clientId, points, description, type: workOrderId }); setPointsHistory(prev => [...prev, entry]); };
  
  // MEMOIZED HELPERS TO PREVENT INFINITE LOOPS
  const getClientPoints = useCallback((clientId: string): ClientPoints | undefined => {
      const client = clients.find(c => c.id === clientId);
      if (!client) return undefined;
      const multiplier = companySettings.gamification.pointsMultiplier || 1;
      const ltvPoints = Math.floor((client.ltv || 0) * multiplier);
      const clientHistory = pointsHistory.filter(h => h.client_id === clientId);
      const manualPoints = clientHistory.reduce((acc, h) => acc + (h.points || 0), 0);
      const clientRedemptions = redemptions.filter(r => r.clientId === clientId);
      const spentPoints = clientRedemptions.reduce((acc, r) => acc + r.pointsCost, 0);
      const totalPoints = ltvPoints + manualPoints - spentPoints;
      const tiers = companySettings.gamification.tiers || defaultTiers;
      let currentTier: TierLevel = 'bronze';
      let currentLevel = 1;
      const sortedTiers = [...tiers].sort((a, b) => b.minPoints - a.minPoints);
      const matchedTier = sortedTiers.find(t => totalPoints >= t.minPoints);
      if (matchedTier) { currentTier = matchedTier.id; currentLevel = tiers.findIndex(t => t.id === matchedTier.id) + 1; }
      return { clientId, totalPoints: Math.max(0, totalPoints), currentLevel, tier: currentTier, lastServiceDate: client.lastVisit, servicesCompleted: client.visitCount, pointsHistory: clientHistory.map(h => ({ id: h.id, workOrderId: h.type, points: h.points, description: h.description, date: h.created_at })) };
  }, [clients, pointsHistory, redemptions, companySettings.gamification.pointsMultiplier, companySettings.gamification.tiers]);

  const seedDefaultCampaigns = async () => { if (!tenantId) return; const templates = [ { name: 'Reativação', type: 'reactivation', targetSegment: 'inactive', messageTemplate: 'Olá! Sentimos sua falta.', status: 'sent', sentCount: 45, conversionCount: 12, revenueGenerated: 3500, costInTokens: 45, date: new Date().toISOString() }, { name: 'Promoção Relâmpago', type: 'flash', targetSegment: 'recurring', messageTemplate: 'Promoção hoje.', status: 'sent', sentCount: 120, conversionCount: 28, revenueGenerated: 5600, costInTokens: 120, date: new Date().toISOString() }, { name: 'VIP Experience', type: 'vip', targetSegment: 'vip', messageTemplate: 'Convite VIP.', status: 'scheduled', sentCount: 0, conversionCount: 0, revenueGenerated: 0, costInTokens: 0, date: new Date().toISOString() } ]; for (const t of templates) { await createCampaign(t as any); } };
  
  const seedMockReviews = async () => {
    if (!tenantId) return;
    
    // Create mock orders with reviews
    const reviews = [
        {
            clientName: 'Roberto Silva',
            vehicle: 'BMW 320i',
            service: 'Vitrificação 9H',
            score: 10,
            comment: 'Serviço impecável! O carro parece novo, brilho absurdo.',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
        },
        {
            clientName: 'Fernanda Lima',
            vehicle: 'Porsche Macan',
            service: 'Higienização Premium',
            score: 9,
            comment: 'Muito bom, atendimento excelente. O interior ficou perfeito.',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() // 5 days ago
        },
        {
            clientName: 'Carlos Oliveira',
            vehicle: 'Honda Civic',
            service: 'Polimento Técnico',
            score: 8,
            comment: 'Resultado ótimo, mas demorou um pouco mais que o previsto na entrega.',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() // 10 days ago
        }
    ];

    for (const review of reviews) {
        // Find or create client
        let client = clients.find(c => c.name === review.clientName);
        // If not found (unlikely with mock data but safe check), use first available or skip
        if (!client && clients.length > 0) client = clients[0];
        
        if (client) {
            const os: WorkOrder = {
                id: `OS-NPS-${Math.floor(Math.random() * 10000)}`,
                clientId: client.id,
                vehicle: review.vehicle,
                plate: 'MOCK-000',
                service: review.service,
                status: 'Concluído',
                technician: 'João Técnico',
                deadline: 'Concluído',
                priority: 'medium',
                totalValue: 500,
                damages: [],
                vehicleInventory: { estepe: false, macaco: false, chaveRoda: false, tapetes: false, manual: false, antena: false, pertences: '' },
                dailyLog: [],
                qaChecklist: [],
                tasks: [],
                checklist: [],
                createdAt: review.date,
                paymentStatus: 'paid',
                paidAt: review.date,
                npsScore: review.score,
                npsComment: review.comment,
                tenant_id: tenantId
            };
            await addWorkOrder(os);
        }
    }
  };

  const getWhatsappLink = (p: string, m: string) => `https://wa.me/${p}?text=${encodeURIComponent(m)}`;
  
  const calculateServiceCost = useCallback((serviceId: string) => { 
      const consumption = serviceConsumptions.find(c => c.serviceId === serviceId); 
      if (!consumption) return 0; 
      return consumption.items.reduce((total, item) => { 
          const invItem = inventory.find(i => i.id === item.inventoryId); 
          if (!invItem) return total; 
          let multiplier = 1; 
          const stockUnit = invItem.unit.toLowerCase(); 
          const usageUnit = item.usageUnit.toLowerCase(); 
          if (stockUnit === 'l' && usageUnit === 'ml') multiplier = 0.001; 
          else if (stockUnit === 'kg' && usageUnit === 'g') multiplier = 0.001; 
          else if (stockUnit === 'ml' && usageUnit === 'l') multiplier = 1000; 
          else if (stockUnit === 'g' && usageUnit === 'kg') multiplier = 1000; 
          return total + (invItem.costPrice * item.quantity * multiplier); 
      }, 0); 
  }, [serviceConsumptions, inventory]);

  const createSocialPost = (post: SocialPost) => { setSocialPosts(prev => [post, ...prev]); };
  const generateSocialContent = async (workOrder: WorkOrder): Promise<{ caption: string; hashtags: string[] }> => { await new Promise(resolve => setTimeout(resolve, 1500)); const vehicle = workOrder.vehicle; const service = workOrder.service; const captions = [ `✨ Transformação incrível neste ${vehicle}! Realizamos ${service} com o máximo de cuidado. O resultado fala por si só! 🚗💎`, `🔥 Mais um entregue! ${vehicle} recebeu nosso tratamento premium de ${service}. Proteção e brilho garantidos.`, `👀 Olha esse antes e depois! ${service} no ${vehicle}. Qualidade que você só encontra na Cristal Care.` ]; const hashtags = ['#esteticaautomotiva', '#detailing', '#carcare', `#${vehicle.replace(/\s/g, '').toLowerCase()}`, '#brilho', '#protecao']; return { caption: captions[Math.floor(Math.random() * captions.length)], hashtags }; };
  
  const createFidelityCard = useCallback(async (cid: string) => { 
      const existing = fidelityCards.find(c => c.clientId === cid);
      if (existing) return existing;

      const card: FidelityCard = { clientId: cid, cardNumber: Math.random().toString(36).substring(2, 10).toUpperCase(), cardHolder: 'Cliente', cardColor: 'blue', qrCode: '', expiresAt: '', issueDate: '' }; 
      setFidelityCards(prev => [...prev, card]); 
      if (tenantId) {
         await db.create('fidelity_cards', { ...card, tenant_id: tenantId, client_id: cid, card_number: card.cardNumber });
      }
      return card; 
  }, [fidelityCards, tenantId]);

  const getFidelityCard = useCallback((cid: string) => fidelityCards.find(c => c.clientId === cid), [fidelityCards]);
  
  const addReward = async (r: any) => { const newR = await db.create('rewards', { ...r, tenant_id: tenantId, config: { percentage: r.percentage, value: r.value, gift: r.gift } }); setRewards(prev => [...prev, newR as Reward]); };
  const updateReward = async (id: string, u: any) => { await db.update('rewards', id, u); setRewards(prev => prev.map(r => r.id === id ? { ...r, ...u } : r)); };
  const deleteReward = async (id: string) => { await db.delete('rewards', id); setRewards(prev => prev.filter(r => r.id !== id)); };
  
  const getRewardsByLevel = useCallback((level: TierLevel) => rewards.filter(r => r.requiredLevel === level), [rewards]);
  
  const updateTierConfig = () => {};
  const generatePKPass = () => ''; const generateGoogleWallet = () => '';
  
  const claimReward = (cid: string, rid: string) => { const code = Math.random().toString(36).substring(7).toUpperCase(); const red: Redemption = { id: `red-${Date.now()}`, clientId: cid, rewardId: rid, rewardName: 'Reward', code, pointsCost: 100, status: 'active', redeemedAt: new Date().toISOString() }; setRedemptions(prev => [...prev, red]); return { success: true, message: 'Resgatado!', voucherCode: code }; };
  const getClientRedemptions = (cid: string) => redemptions.filter(r => r.clientId === cid);
  
  const useVoucher = (code: string, workOrderId: string) => { 
      const usedAt = new Date().toISOString();
      setRedemptions(prev => prev.map(r => r.code === code ? { ...r, status: 'used', usedAt, usedInWorkOrderId: workOrderId } : r));
      
      // Update DB if tenantId exists (Mock DB handles partial updates)
      if (tenantId) {
          const redemption = redemptions.find(r => r.code === code);
          if (redemption) {
              db.update('redemptions', redemption.id, { status: 'used', usedAt, usedInWorkOrderId: workOrderId });
          }
      }
      return true; 
  };
  
  const getVoucherDetails = (code: string) => { const r = redemptions.find(red => red.code === code); return r ? { redemption: r, reward: rewards.find(rew => rew.id === r.rewardId) } : null; };
  
  const updateServiceConsumption = async (c: ServiceConsumption) => { setServiceConsumptions(prev => { const idx = prev.findIndex(sc => sc.serviceId === c.serviceId); if (idx >= 0) { const newArr = [...prev]; newArr[idx] = c; return newArr; } return [...prev, c]; }); return true; };
  
  const getServiceConsumption = useCallback((sId: string) => serviceConsumptions.find(c => c.serviceId === sId), [serviceConsumptions]);

  const getPrice = useCallback((sId: string, size: VehicleSize) => priceMatrix.find(p => p.serviceId === sId && p.size === size)?.price || 0, [priceMatrix]);

  return (
    <AppContext.Provider value={{ 
      inventory, workOrders, clients, recipes, reminders, services, priceMatrix, theme,
      employees, employeeTransactions, currentUser, ownerUser, campaigns, clientPoints, fidelityCards, rewards, redemptions,
      companySettings, subscription, updateCompanySettings,
      financialTransactions,
      systemAlerts,
      markAlertResolved: (id) => setSystemAlerts(prev => prev.filter(a => a.id !== id)),
      login: (pin) => { const e = employees.find(emp => emp.pin === pin && emp.active); if(e) { setCurrentUser(e); return true; } return false; }, 
      logout: () => setCurrentUser(null),
      loginOwner, registerOwner, logoutOwner, updateOwner, createTenant: async () => true, reloadUserData,
      addWorkOrder, updateWorkOrder, completeWorkOrder,
      recalculateClientMetrics: () => {}, updateClientLTV: (cid, amt) => { const c = clients.find(cl => cl.id === cid); if (c) updateClient(cid, { ltv: (c.ltv || 0) + amt }); },
      updateClientVisits: (cid, amt) => { const c = clients.find(cl => cl.id === cid); if (c) updateClient(cid, { visitCount: (c.visitCount || 0) + amt }); },
      submitNPS: (id, score) => updateWorkOrder(id, { npsScore: score }),
      addClient, updateClient, deleteClient, addVehicle: async (cid, v) => { const client = clients.find(c => c.id === cid); if (client) { const newVehicles = [...client.vehicles, { ...v, id: `v-${Date.now()}` } as Vehicle]; await updateClient(cid, { vehicles: newVehicles } as any); } },
      updateVehicle: async (cid, v) => { const client = clients.find(c => c.id === cid); if (client) { const newVehicles = client.vehicles.map(veh => veh.id === v.id ? v : veh); await updateClient(cid, { vehicles: newVehicles } as any); } },
      removeVehicle: async (cid, vid) => { const client = clients.find(c => c.id === cid); if (client) { const newVehicles = client.vehicles.filter(veh => veh.id !== vid); await updateClient(cid, { vehicles: newVehicles } as any); } },
      addInventoryItem, updateInventoryItem, deleteInventoryItem, deductStock,
      toggleTheme, generateReminders: () => {},
      updatePrice, updateServiceInterval: () => {}, bulkUpdatePrices: () => {}, getPrice, 
      addService, updateService, deleteService, assignTask: () => {}, startTask: () => {}, stopTask: () => {}, 
      addEmployeeTransaction, updateEmployeeTransaction, deleteEmployeeTransaction, addEmployee, updateEmployee, deleteEmployee,
      addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction,
      createCampaign, updateCampaign, deleteCampaign, seedDefaultCampaigns, seedMockReviews, getWhatsappLink,
      
      connectWhatsapp, disconnectWhatsapp, simulateWhatsappScan,
      messageLogs,
      
      addPointsToClient, getClientPoints, createFidelityCard, getFidelityCard,
      addReward, updateReward, deleteReward, getRewardsByLevel, updateTierConfig, generatePKPass, generateGoogleWallet, claimReward, getClientRedemptions, useVoucher, getVoucherDetails,
      notifications, markNotificationAsRead, clearAllNotifications, addNotification,
      updateServiceConsumption, getServiceConsumption, calculateServiceCost, serviceConsumptions,
      buyTokens, consumeTokens, changePlan,
      isAppLoading, tenantId,
      socialPosts, createSocialPost, generateSocialContent,
      checkPermission, checkLimit, planLimits,
      cancelSubscription: async () => {
          if (!tenantId) return;
          const updatedSub = { ...subscription, status: 'inactive' as const };
          setSubscription(updatedSub);
          await db.update('tenants', tenantId, { subscription: updatedSub });
      }
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
}
