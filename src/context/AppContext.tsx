import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Client, InventoryItem, WorkOrder, ServiceRecipe, Reminder, Vehicle, 
  ServiceCatalogItem, PriceMatrixEntry, VehicleSize, Employee, Task, 
  EmployeeTransaction, MarketingCampaign,
  CompanySettings, SubscriptionDetails, FinancialTransaction, ClientPoints, FidelityCard, Reward,
  Redemption, TierConfig, TierLevel, ShopOwner, Notification, ServiceConsumption, AuthResponse,
  SystemAlert
} from '../types';
import { addDays, formatISO, differenceInDays } from 'date-fns';
import { db } from '../lib/db';
import { formatId } from '../lib/utils';
import { MOCK_ALERTS } from '../lib/mockData';

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
  
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  
  systemAlerts: SystemAlert[];
  markAlertResolved: (id: string) => void;
  
  companySettings: CompanySettings;
  subscription: SubscriptionDetails;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  
  buyTokens: (amount: number, cost: number) => void;
  consumeTokens: (amount: number, description: string) => boolean;
  changePlan: (planId: 'starter' | 'pro' | 'enterprise' | 'trial') => void;

  connectWhatsapp: () => void;
  disconnectWhatsapp: () => void;
  
  login: (pin: string) => boolean; 
  logout: () => void; 
  
  loginOwner: (email: string, password: string) => Promise<AuthResponse>;
  registerOwner: (name: string, email: string, shopName: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutOwner: () => Promise<void>;
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
  getWhatsappLink: (phone: string, message: string) => string;

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

// ... (Constants remain the same) ...
const defaultTiers: TierConfig[] = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, color: 'from-amber-500 to-amber-600', benefits: ['5% desconto em serviços'] },
  { id: 'silver', name: 'Prata', minPoints: 500, color: 'from-slate-400 to-slate-600', benefits: ['10% desconto', 'Frete grátis'] },
  { id: 'gold', name: 'Ouro', minPoints: 1500, color: 'from-yellow-500 to-yellow-600', benefits: ['15% desconto', 'Atendimento VIP'] },
  { id: 'platinum', name: 'Platina', minPoints: 3000, color: 'from-blue-500 to-blue-600', benefits: ['20% desconto', 'Brinde exclusivo', 'Suporte 24h'] }
];

const initialCompanySettings: CompanySettings = {
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
      recall: 'Olá {cliente}, já faz um tempo que cuidamos do seu {veiculo}. Que tal renovar a proteção?'
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

export function AppProvider({ children }: { children: ReactNode }) {
  // --- STATE ---
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
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [recipes] = useState<ServiceRecipe[]>([]);

  // Initialize DB
  useEffect(() => {
    db.init();
    
    // Check for existing session in localStorage
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
        setCompanySettings({ ...initialCompanySettings, ...(tenant.settings || {}) });
        setSubscription({ ...initialSubscription, ...(tenant.subscription || {}) });

        // Load all collections
        const [
          clientsData, wosData, invData, servicesData, empData, finData,
          rewardsData, redemptionsData, cardsData, historyData, campaignsData, alertsData
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
          db.getAll<any>('alerts')
        ]);

        // Process Clients
        setClients(clientsData.map(c => ({
          ...c,
          vehicles: c.vehicles || []
        })));

        // Process WorkOrders
        setWorkOrders(wosData.map(o => ({
          ...o,
          ...o.json_data // Flatten json_data
        })));

        setInventory(invData);
        
        // Process Services
        const mappedServices = servicesData.map(s => ({
          ...s,
          ...s.price_matrix // Flatten price_matrix
        }));
        setServices(mappedServices);
        
        // Extract Price Matrix
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
            messageTemplate: c.message_template,
            sentCount: c.sent_count,
            conversionCount: c.conversion_count,
            revenueGenerated: c.revenue_generated,
            cost_in_tokens: c.cost_in_tokens
        })));

        // --- INTELLIGENCE SEEDING ---
        // Se não houver alertas, popula com os dados de inteligência operacional
        let currentAlerts = alertsData;
        if (currentAlerts.length === 0) {
            console.log("Seeding operational intelligence alerts...");
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

  // --- AUTH ACTIONS ---
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
      
      // Create Tenant automatically
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
    // ... clear other states
  };

  // --- CRUD WRAPPERS ---
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
      json_data: { ...os } // Store full object for simplicity in mock
    };
    const newOS = await db.create('work_orders', payload);
    setWorkOrders(prev => [newOS as unknown as WorkOrder, ...prev]);
    return true;
  };

  const updateWorkOrder = async (id: string, updates: Partial<WorkOrder>) => {
    const current = workOrders.find(o => o.id === id);
    if (!current) return false;
    
    const merged = { ...current, ...updates };
    const payload = {
      ...updates,
      json_data: merged,
      status: updates.status,
      total_value: updates.totalValue
    };
    
    await db.update('work_orders', id, payload);
    setWorkOrders(prev => prev.map(o => o.id === id ? merged : o));
    return true;
  };

  const addInventoryItem = async (item: any) => {
    if (!tenantId) return;
    const newItem = await db.create('inventory', { ...item, tenant_id: tenantId, status: 'ok' });
    setInventory(prev => [...prev, newItem as InventoryItem]);
  };

  const updateInventoryItem = async (id: number, updates: any) => {
    await db.update('inventory', id, updates);
    setInventory(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteInventoryItem = async (id: number) => {
    await db.delete('inventory', id);
    setInventory(prev => prev.filter(i => i.id !== id));
  };

  const addService = async (service: any) => {
    if (!tenantId) return;
    const newService = await db.create('services', { 
      ...service, 
      tenant_id: tenantId,
      price_matrix: { prices: {}, consumption: [], imageUrl: service.imageUrl, returnIntervalDays: service.returnIntervalDays }
    });
    setServices(prev => [...prev, newService as ServiceCatalogItem]);
  };

  const updateService = async (id: string, updates: any) => {
    await db.update('services', id, updates);
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteService = async (id: string) => {
    await db.delete('services', id);
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const addEmployee = async (employee: any) => {
    if (!tenantId) return;
    const newEmp = await db.create('employees', { 
      ...employee, 
      tenant_id: tenantId, 
      salary_data: { ...employee } 
    });
    setEmployees(prev => [...prev, newEmp as Employee]);
  };

  const updateEmployee = async (id: string, updates: any) => {
    await db.update('employees', id, { ...updates, salary_data: updates });
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEmployee = async (id: string) => {
    await db.delete('employees', id);
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const addFinancialTransaction = async (trans: any) => {
    if (!tenantId) return;
    const newTrans = await db.create('financial_transactions', { ...trans, tenant_id: tenantId });
    setFinancialTransactions(prev => [newTrans as FinancialTransaction, ...prev]);
  };

  const updateFinancialTransaction = async (id: number, updates: any) => {
    await db.update('financial_transactions', id, updates);
    setFinancialTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteFinancialTransaction = async (id: number) => {
    await db.delete('financial_transactions', id);
    setFinancialTransactions(prev => prev.filter(t => t.id !== id));
  };

  // --- SETTINGS UPDATE ---
  const updateCompanySettings = async (settings: Partial<CompanySettings>) => {
    if (!tenantId) return;
    const newSettings = { ...companySettings, ...settings };
    setCompanySettings(newSettings);
    await db.update('tenants', tenantId, { settings: newSettings });
  };

  // ... (Keep existing logic for helpers that don't need DB) ...
  const updatePrice = (serviceId: string, size: VehicleSize, newPrice: number) => {
    setPriceMatrix(prev => {
        const existing = prev.find(p => p.serviceId === serviceId && p.size === size);
        if (existing) return prev.map(p => p.serviceId === serviceId && p.size === size ? { ...p, price: newPrice } : p);
        return [...prev, { serviceId, size, price: newPrice }];
    });
    // Debounce save to DB
    setTimeout(async () => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
             // Logic to update nested price_matrix in db...
        }
    }, 1000);
  };

  const createCampaign = async (campaign: MarketingCampaign) => {
      if (!tenantId) return;
      const newCamp = await db.create('marketing_campaigns', { 
          ...campaign, 
          tenant_id: tenantId,
          target_segment: campaign.targetSegment,
          message_template: campaign.messageTemplate,
          sent_count: campaign.sentCount,
          cost_in_tokens: campaign.costInTokens
      });
      setCampaigns(prev => [...prev, newCamp as unknown as MarketingCampaign]);
  };

  const updateCampaign = async (id: string, updates: Partial<MarketingCampaign>) => {
      await db.update('marketing_campaigns', id, updates);
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCampaign = async (id: string) => {
      await db.delete('marketing_campaigns', id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const getWhatsappLink = (p: string, m: string) => `https://wa.me/${p}?text=${encodeURIComponent(m)}`;
  
  const addPointsToClient = async (clientId: string, workOrderId: string, points: number, description: string) => {
      if (!tenantId) return;
      const entry = await db.create('points_history', { tenant_id: tenantId, client_id: clientId, points, description, type: workOrderId });
      setPointsHistory(prev => [...prev, entry]);
  };

  const getClientPoints = (clientId: string): ClientPoints | undefined => {
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
      if (matchedTier) {
          currentTier = matchedTier.id;
          currentLevel = tiers.findIndex(t => t.id === matchedTier.id) + 1;
      }

      return {
          clientId,
          totalPoints: Math.max(0, totalPoints),
          currentLevel,
          tier: currentTier,
          lastServiceDate: client.lastVisit,
          servicesCompleted: client.visitCount,
          pointsHistory: clientHistory.map(h => ({ id: h.id, workOrderId: h.type, points: h.points, description: h.description, date: h.created_at }))
      };
  };

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
      
      loginOwner,
      registerOwner,
      logoutOwner,
      createTenant: async (name, phone) => { return true; }, // Mock always success
      reloadUserData: async () => { if(ownerUser) await loadTenantData(ownerUser.id); return true; },

      addWorkOrder, updateWorkOrder, 
      completeWorkOrder: (id, snapshot) => {
          updateWorkOrder(id, { status: 'Concluído' });
          // Logic for stock deduction and points...
      },
      recalculateClientMetrics: () => {},
      updateClientLTV: (cid, amt) => {
          const c = clients.find(cl => cl.id === cid);
          if (c) updateClient(cid, { ltv: (c.ltv || 0) + amt });
      },
      updateClientVisits: (cid, amt) => {
          const c = clients.find(cl => cl.id === cid);
          if (c) updateClient(cid, { visitCount: (c.visitCount || 0) + amt });
      },
      submitNPS: (id, score) => updateWorkOrder(id, { npsScore: score }),
      
      addClient, updateClient, deleteClient, 
      addVehicle: async (cid, v) => {
          const client = clients.find(c => c.id === cid);
          if (client) {
              const newVehicles = [...client.vehicles, { ...v, id: `v-${Date.now()}` } as Vehicle];
              await updateClient(cid, { vehicles: newVehicles } as any); // Mock handles nested update
          }
      },
      updateVehicle: async (cid, v) => {
          const client = clients.find(c => c.id === cid);
          if (client) {
              const newVehicles = client.vehicles.map(veh => veh.id === v.id ? v : veh);
              await updateClient(cid, { vehicles: newVehicles } as any);
          }
      },
      removeVehicle: async (cid, vid) => {
          const client = clients.find(c => c.id === cid);
          if (client) {
              const newVehicles = client.vehicles.filter(veh => veh.id !== vid);
              await updateClient(cid, { vehicles: newVehicles } as any);
          }
      },

      addInventoryItem, updateInventoryItem, deleteInventoryItem, deductStock: () => {},
      
      toggleTheme: () => setTheme(prev => prev === 'dark' ? 'light' : 'dark'), 
      generateReminders: () => {},
      
      updatePrice, updateServiceInterval: () => {}, bulkUpdatePrices: () => {}, 
      getPrice: (sId, size) => priceMatrix.find(p => p.serviceId === sId && p.size === size)?.price || 0, 
      
      addService, updateService, deleteService,
      
      assignTask: () => {}, startTask: () => {}, stopTask: () => {}, 
      addEmployeeTransaction: (t) => setEmployeeTransactions(prev => [...prev, t]), 
      updateEmployeeTransaction: () => {}, deleteEmployeeTransaction: () => {},
      addEmployee, updateEmployee, deleteEmployee,
      
      addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction,
      
      createCampaign, updateCampaign, deleteCampaign, 
      seedDefaultCampaigns: async () => {}, 
      getWhatsappLink,
      connectWhatsapp: () => {}, disconnectWhatsapp: () => {},
      
      addPointsToClient, getClientPoints, 
      createFidelityCard: async (cid) => {
          const card: FidelityCard = { clientId: cid, cardNumber: '1234', cardHolder: 'Cliente', cardColor: 'blue', qrCode: '', expiresAt: '', issueDate: '' };
          setFidelityCards(prev => [...prev, card]);
          return card;
      }, 
      getFidelityCard: (cid) => fidelityCards.find(c => c.clientId === cid),
      
      addReward: async (r) => {
          const newR = await db.create('rewards', { ...r, tenant_id: tenantId, config: { percentage: r.percentage, value: r.value, gift: r.gift } });
          setRewards(prev => [...prev, newR as Reward]);
      }, 
      updateReward: async (id, u) => {
          await db.update('rewards', id, u);
          setRewards(prev => prev.map(r => r.id === id ? { ...r, ...u } : r));
      }, 
      deleteReward: async (id) => {
          await db.delete('rewards', id);
          setRewards(prev => prev.filter(r => r.id !== id));
      }, 
      getRewardsByLevel: (level) => rewards.filter(r => r.requiredLevel === level),
      
      updateTierConfig: () => {}, 
      generatePKPass: () => '', generateGoogleWallet: () => '', 
      claimReward: (cid, rid) => {
          const code = Math.random().toString(36).substring(7).toUpperCase();
          const red: Redemption = { id: `red-${Date.now()}`, clientId: cid, rewardId: rid, rewardName: 'Reward', code, pointsCost: 100, status: 'active', redeemedAt: new Date().toISOString() };
          setRedemptions(prev => [...prev, red]);
          return { success: true, message: 'Resgatado!', voucherCode: code };
      }, 
      getClientRedemptions: (cid) => redemptions.filter(r => r.clientId === cid), 
      useVoucher: (code) => {
          setRedemptions(prev => prev.map(r => r.code === code ? { ...r, status: 'used' } : r));
          return true;
      }, 
      getVoucherDetails: (code) => {
          const r = redemptions.find(red => red.code === code);
          return r ? { redemption: r, reward: rewards.find(rew => rew.id === r.rewardId) } : null;
      },
      
      notifications, markNotificationAsRead: () => {}, clearAllNotifications: () => {}, addNotification: () => {},
      
      updateServiceConsumption: async (c) => {
          setServiceConsumptions(prev => [...prev, c]);
          return true;
      }, 
      getServiceConsumption: (sId) => serviceConsumptions.find(c => c.serviceId === sId), 
      calculateServiceCost: () => 0, serviceConsumptions,
      
      buyTokens: () => {}, consumeTokens: () => true, changePlan: () => {},
      
      isAppLoading,
      tenantId
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
