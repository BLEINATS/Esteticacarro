import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { 
  Client, InventoryItem, WorkOrder, ServiceRecipe, Reminder, Vehicle, 
  ServiceCatalogItem, PriceMatrixEntry, VehicleSize, Employee, Task, 
  EmployeeTransaction, MarketingCampaign,
  CompanySettings, SubscriptionDetails, FinancialTransaction, ClientPoints, FidelityCard, Reward,
  Redemption, TierConfig, TierLevel, ShopOwner, Notification, ServiceConsumption, AuthResponse,
  SystemAlert
} from '../types';
import { addDays, formatISO, differenceInDays, subDays, isAfter } from 'date-fns';
import { supabase } from '../lib/supabase';
import { formatId } from '../lib/utils';

// ... (Keeping interfaces implicit to save space, they are imported from types) ...
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
  
  // Intelligence Alerts
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

// ... (initial data constants) ...
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

// Helper for UUID generation
function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

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

  const userIdRef = useRef<string | null>(null);
  const loadingPromiseRef = useRef<Promise<boolean> | null>(null);
  const priceUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingPriceUpdates = useRef<Record<string, { serviceId: string, size: VehicleSize, price: number }>>({});

  useEffect(() => {
    userIdRef.current = ownerUser?.id || null;
  }, [ownerUser]);

  // --- AUTH & INITIALIZATION ---
  // ... (Keep existing auth logic) ...
  useEffect(() => {
    let mounted = true;

    // Failsafe Timeout - Force app load if Supabase hangs
    const timeout = setTimeout(() => {
        if (mounted && isAppLoading) {
            console.warn("Supabase connection timeout - forcing app load");
            setIsAppLoading(false);
        }
    }, 60000); // 1 minute failsafe

    const initSession = async () => {
      try {
        setIsAppLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        const session = data.session;
        
        if (session?.user && mounted) {
          await loadTenantData(session.user.id, session.user.email || '');
        } else if (mounted) {
          setIsAppLoading(false);
        }
      } catch (error: any) {
        console.error("Session initialization error:", error);
        
        // Handle invalid refresh token by clearing corrupted local storage
        if (error?.code === 'refresh_token_not_found' || error?.message?.includes('Invalid Refresh Token')) {
            console.warn("Refresh token invalid. Clearing session to allow re-login.");
            await supabase.auth.signOut();
            setOwnerUser(null);
            setTenantId(null);
        }

        if (mounted) setIsAppLoading(false);
      }
    };
    
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        if (userIdRef.current === session.user.id) {
            return;
        }
        setIsAppLoading(true);
        await loadTenantData(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        setOwnerUser(null);
        setTenantId(null);
        setClients([]);
        setWorkOrders([]);
        setInventory([]);
        setServices([]);
        setEmployees([]);
        setFinancialTransactions([]);
        setSystemAlerts([]);
        setIsAppLoading(false);
      }
    });

    return () => {
        mounted = false;
        clearTimeout(timeout);
        subscription.unsubscribe();
    };
  }, []);

  const loadTenantData = async (userId: string, email: string): Promise<boolean> => {
    if (loadingPromiseRef.current) {
        return loadingPromiseRef.current;
    }

    loadingPromiseRef.current = (async () => {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                attempts++;
                console.log(`Loading tenant data... Attempt ${attempts}`);

                // IMPORTANT: Execute the query builder to get a Promise
                const queryPromise = supabase.from('tenants').select('*').eq('owner_id', userId).limit(1).then(res => res);
                
                let data, error;

                // Strategy: Timeout on first attempts, NO timeout on last attempt (allow DB to wake up)
                if (attempts < maxAttempts) {
                    const timeoutDuration = attempts === 1 ? 10000 : 30000;
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error(`Timeout loading tenant (${timeoutDuration}ms)`)), timeoutDuration)
                    );
                    
                    const result = await Promise.race([queryPromise, timeoutPromise]) as any;
                    data = result.data;
                    error = result.error;
                } else {
                    // Last attempt: No client-side timeout. Let the browser/Supabase client handle it.
                    console.log("Last attempt: Waiting for DB response (no timeout)...");
                    const result = await queryPromise;
                    data = result.data;
                    error = result.error;
                }
                
                if (error) throw error;
                
                let tenant = null;
                if (data && data.length > 0) {
                    tenant = data[0];
                }

                if (tenant) {
                    // Tenant FOUND - Load everything
                    setTenantId(tenant.id);
                    setOwnerUser({ id: userId, name: tenant.name, email, shopName: tenant.name });
                    
                    try {
                        const settings = tenant.settings as any || {};
                        setCompanySettings({ ...initialCompanySettings, ...settings, name: tenant.name, slug: tenant.slug });
                        const sub = tenant.subscription as any || {};
                        setSubscription({ ...initialSubscription, ...sub });
                    } catch (e) { console.error("Error parsing settings:", e); }

                    await Promise.allSettled([
                        fetchClients(tenant.id),
                        fetchWorkOrders(tenant.id),
                        fetchInventory(tenant.id),
                        fetchServices(tenant.id),
                        fetchEmployees(tenant.id),
                        fetchFinancials(tenant.id),
                        fetchGamificationData(tenant.id),
                        fetchCampaigns(tenant.id),
                        fetchSystemAlerts(tenant.id) // NEW: Fetch Alerts
                    ]);
                    
                    // Run Intelligence Engine after loading data
                    setTimeout(() => runIntelligenceEngine(tenant.id), 2000);
                    
                    setIsAppLoading(false);
                    return true;
                } else {
                    // Tenant NOT FOUND - User logged in but no store yet (New User Flow)
                    console.log("No tenant found for user:", userId);
                    
                    const { data: { user } } = await supabase.auth.getUser();
                    const meta = user?.user_metadata || {};
                    const name = meta.name || 'Usuário';
                    const shopName = meta.shop_name || ''; // Capture shop_name from metadata
                    
                    setOwnerUser({ id: userId, name: name, email, shopName: shopName });
                    setTenantId(null); // Explicitly null
                    setIsAppLoading(false);
                    return true; // Return true because login was successful, just no data
                }
            } catch (err) {
                const isLastAttempt = attempts >= maxAttempts;
                
                console.warn(`Load attempt ${attempts} failed:`, err);
                
                if (isLastAttempt) {
                    console.error("All load attempts failed.");
                    setIsAppLoading(false);
                    return false;
                }
                
                // Wait before retrying (backoff: 2s, 4s)
                await new Promise(r => setTimeout(r, 2000 * attempts));
            }
        }
        setIsAppLoading(false);
        return false;
    })();

    try {
        return await loadingPromiseRef.current;
    } finally {
        loadingPromiseRef.current = null;
    }
  };

  // --- INTELLIGENCE ENGINE ---
  const fetchSystemAlerts = async (tId: string) => {
      const { data } = await supabase.from('alerts').select('*').eq('tenant_id', tId).eq('resolved', false).order('created_at', { ascending: false });
      if (data) {
          setSystemAlerts(data.map(a => ({
              id: a.id,
              type: a.type as any,
              message: a.message,
              level: a.level as any,
              actionLink: a.action_link,
              actionLabel: a.action_label,
              resolved: a.resolved,
              createdAt: a.created_at,
              financialImpact: (a as any).financial_impact || 0 // Map new field
          })));
      }
  };

  const runIntelligenceEngine = async (tId: string) => {
      console.log("Running Intelligence Engine...");
      
      // 1. Fetch fresh data for calculation (to ensure we have latest)
      const { data: workOrdersData } = await supabase.from('work_orders').select('*').eq('tenant_id', tId);
      const { data: clientsData } = await supabase.from('clients').select('id, name, last_visit, status, ltv').eq('tenant_id', tId);
      const { data: servicesData } = await supabase.from('services').select('id, standard_time').eq('tenant_id', tId);
      
      if (!workOrdersData || !clientsData || !servicesData) return;

      const newAlerts: Omit<SystemAlert, 'id' | 'createdAt' | 'resolved'>[] = [];

      // --- KPI 1: Occupancy (Next 7 Days) ---
      // Simple heuristic: Assume 8h/day * 6 days * 2 employees (default) capacity if not set
      const today = new Date();
      const nextWeek = addDays(today, 7);
      
      const upcomingOrders = workOrdersData.filter(os => {
          const deadline = os.deadline ? new Date(os.deadline) : null;
          return deadline && deadline >= today && deadline <= nextWeek && os.status !== 'Cancelado';
      });

      // Calculate total minutes booked
      let bookedMinutes = 0;
      upcomingOrders.forEach(os => {
          // Try to find service duration
          const service = servicesData.find(s => s.id === os.serviceId || (os.serviceIds && os.serviceIds.includes(s.id)));
          bookedMinutes += service?.standard_time || 60; // Default 60 if not found
      });

      // Capacity: 2 employees * 8h * 60m * 6 working days
      const estimatedCapacityMinutes = 2 * 8 * 60 * 6; 
      const occupancyRate = (bookedMinutes / estimatedCapacityMinutes) * 100;

      if (occupancyRate < 50) {
          // Calculate potential revenue loss (Opportunity cost)
          // Assume average ticket of 250 BRL for empty slots
          const emptySlots = Math.floor((estimatedCapacityMinutes - bookedMinutes) / 60);
          const potentialLoss = emptySlots * 150; // Conservative 150/h

          newAlerts.push({
              type: 'agenda',
              message: `Agenda com baixa ocupação (${occupancyRate.toFixed(0)}%) nos próximos 7 dias.`,
              level: 'atencao',
              actionLink: '/marketing',
              actionLabel: 'Criar Promoção',
              financialImpact: potentialLoss
          });
      }

      // --- KPI 2: Inactive Clients (> 60 days) ---
      const inactiveClients = clientsData.filter(c => {
          const lastVisit = c.last_visit ? new Date(c.last_visit) : null;
          return lastVisit && differenceInDays(today, lastVisit) > 60;
      });

      if (inactiveClients.length > 5) {
          // Calculate total LTV at risk (or potential recovery)
          // Assume we can recover 10% of them with an average ticket of 200
          const recoveryPotential = Math.round(inactiveClients.length * 0.1 * 200);

          newAlerts.push({
              type: 'cliente',
              message: `${inactiveClients.length} clientes não retornam há mais de 60 dias.`,
              level: 'atencao',
              actionLink: '/clients',
              actionLabel: 'Ver Lista de Risco',
              financialImpact: recoveryPotential
          });
      }

      // --- KPI 3: Revenue per Hour (Efficiency) ---
      // Check last 30 days
      const lastMonth = subDays(today, 30);
      const completedRecent = workOrdersData.filter(os => 
          os.status === 'Concluído' && new Date(os.created_at) >= lastMonth
      );

      if (completedRecent.length > 0) {
          const totalRev = completedRecent.reduce((acc, os) => acc + (os.total_value || 0), 0);
          let totalTime = 0;
          completedRecent.forEach(os => {
             const service = servicesData.find(s => s.id === os.serviceId); // Simplified
             totalTime += service?.standard_time || 60;
          });
          
          const revPerHour = totalTime > 0 ? totalRev / (totalTime / 60) : 0;
          
          // Threshold: Arbitrary 100 BRL/h as "good"
          if (revPerHour < 80) {
               newAlerts.push({
                  type: 'financeiro',
                  message: `Receita por hora (R$ ${revPerHour.toFixed(0)}) abaixo da meta ideal (R$ 100).`,
                  level: 'info',
                  actionLink: '/pricing',
                  actionLabel: 'Revisar Preços',
                  financialImpact: 0 // Informational
              });
          }
      }

      // Persist Alerts (Avoid Duplicates)
      for (const alert of newAlerts) {
          // Check if similar active alert exists
          const exists = systemAlerts.some(a => 
              a.type === alert.type && 
              a.message === alert.message && 
              !a.resolved
          );

          if (!exists) {
              const { data, error } = await supabase.from('alerts').insert({
                  tenant_id: tId,
                  type: alert.type,
                  message: alert.message,
                  level: alert.level,
                  action_link: alert.actionLink,
                  action_label: alert.actionLabel,
                  resolved: false,
                  // We need to ensure the DB has this column or we handle it gracefully if not
                  // For this artifact, we assume we can pass it in the insert if the table supports it
                  // If not, we might need a migration, but we are working with existing schema constraints
                  // We will store it in metadata/json if needed, but here we try direct column or ignore
              }).select().single();

              if (data) {
                  setSystemAlerts(prev => [
                      {
                          id: data.id,
                          type: data.type as any,
                          message: data.message,
                          level: data.level as any,
                          actionLink: data.action_link,
                          actionLabel: data.action_label,
                          resolved: data.resolved,
                          createdAt: data.created_at,
                          financialImpact: alert.financialImpact
                      },
                      ...prev
                  ]);
              }
          }
      }
  };

  const markAlertResolved = async (id: string) => {
      setSystemAlerts(prev => prev.filter(a => a.id !== id));
      if (tenantId) {
          await supabase.from('alerts').update({ resolved: true }).eq('id', id);
      }
  };

  // ... (Other functions like createTenant, fetchClients, etc. remain the same) ...
  const createTenant = async (name: string, phone: string): Promise<boolean> => {
      if (!ownerUser) return false;
      
      try {
          const slug = name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random() * 1000);

          const newTenant = {
            owner_id: ownerUser.id,
            name: name,
            slug: slug,
            plan_id: 'trial',
            status: 'active',
            settings: {
                ...initialCompanySettings,
                name: name,
                responsibleName: ownerUser.name,
                email: ownerUser.email,
                phone: phone,
                slug: slug
            },
            subscription: initialSubscription
          };

          const insertPromise = supabase.from('tenants').insert(newTenant).select().single();
          const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout creating store (60s)')), 60000)
          );

          const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;
          
          if (error) {
              console.error("Supabase Insert Error:", error);
              throw error;
          }
          
          if (data) {
              setTenantId(data.id);
              setCompanySettings(newTenant.settings);
              setOwnerUser(prev => prev ? ({ ...prev, shopName: name }) : null);
              setClients([]);
              setWorkOrders([]);
              loadTenantData(ownerUser.id, ownerUser.email);
              return true;
          }
          return false;
      } catch (err) {
          console.error("Error creating tenant:", err);
          return false;
      }
  };

  const fetchClients = async (tId: string) => {
    const { data } = await supabase.from('clients').select(`*, vehicles (*)`).eq('tenant_id', tId);
    if (data) {
      const mappedClients: Client[] = data.map(c => {
        // Automatic Classification Logic
        const lastVisitDate = c.last_visit ? new Date(c.last_visit) : new Date(c.created_at);
        const daysSince = differenceInDays(new Date(), lastVisitDate);
        
        let derivedStatus: 'active' | 'inactive' | 'churn_risk' = 'active';
        if (daysSince > 90) derivedStatus = 'inactive';
        else if (daysSince > 60) derivedStatus = 'churn_risk';

        let derivedSegment: any = 'standard';
        if (c.ltv > 2000 || c.visit_count > 10) derivedSegment = 'vip';
        else if (c.visit_count > 2 && daysSince < 45) derivedSegment = 'recurring';
        else if (c.visit_count <= 1 && daysSince < 30) derivedSegment = 'new';
        else if (daysSince > 60) derivedSegment = 'inactive';

        return {
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email || '',
            cep: c.address_data?.cep,
            street: c.address_data?.street,
            number: c.address_data?.number,
            neighborhood: c.address_data?.neighborhood,
            city: c.address_data?.city,
            state: c.address_data?.state,
            address: c.address_data?.formatted,
            notes: c.notes || '',
            vehicles: c.vehicles.map((v: any) => ({
            id: v.id,
            model: v.model,
            plate: v.plate,
            color: v.color,
            year: v.year,
            size: v.size as VehicleSize
            })),
            ltv: c.ltv,
            visitCount: c.visit_count,
            lastVisit: c.last_visit || new Date().toISOString(),
            status: derivedStatus, // Use derived status
            segment: derivedSegment // Use derived segment
        };
      });
      setClients(mappedClients);
    }
  };
  const fetchWorkOrders = async (tId: string) => {
    const { data } = await supabase.from('work_orders').select('*').eq('tenant_id', tId).order('created_at', { ascending: false });
    if (data) {
      const mappedOrders: WorkOrder[] = data.map(o => {
        const json = o.json_data as any || {};
        return {
          id: o.id, 
          clientId: o.client_id,
          vehicle: json.vehicle || 'Veículo',
          plate: o.vehicle_plate,
          service: o.service_summary,
          status: o.status as any,
          totalValue: o.total_value,
          technician: o.technician,
          deadline: o.deadline || '',
          paymentStatus: o.payment_status as any,
          paymentMethod: o.payment_method || undefined,
          npsScore: o.nps_score || undefined,
          createdAt: o.created_at,
          damages: json.damages || [],
          vehicleInventory: json.vehicleInventory || {},
          dailyLog: json.dailyLog || [],
          qaChecklist: json.qaChecklist || [],
          tasks: json.tasks || [],
          checklist: json.checklist || [],
          additionalItems: json.additionalItems || [],
          discount: json.discount,
          scopeChecklist: json.scopeChecklist,
          serviceIds: json.serviceIds,
          clientSignature: json.clientSignature
        };
      });
      setWorkOrders(mappedOrders);
    }
  };
  const fetchInventory = async (tId: string) => {
    const { data } = await supabase.from('inventory').select('*').eq('tenant_id', tId);
    if (data) {
      setInventory(data.map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        stock: i.stock,
        unit: i.unit,
        minStock: i.min_stock,
        costPrice: i.cost_price,
        status: i.status as any
      })));
    }
  };
  const fetchServices = async (tId: string) => {
    const { data } = await supabase.from('services').select('*').eq('tenant_id', tId);
    if (data) {
      const mappedServices: ServiceCatalogItem[] = data.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        description: s.description || '',
        standardTimeMinutes: s.standard_time,
        active: s.active,
        returnIntervalDays: (s.price_matrix as any)?.returnIntervalDays,
        imageUrl: (s.price_matrix as any)?.imageUrl,
        showOnLandingPage: (s.price_matrix as any)?.showOnLandingPage
      }));
      setServices(mappedServices);
      
      const matrix: PriceMatrixEntry[] = [];
      const consumptions: ServiceConsumption[] = [];
      
      data.forEach(s => {
        const priceMatrixData = s.price_matrix as any || {};
        const prices = priceMatrixData.prices || {};
        
        Object.entries(prices).forEach(([size, price]) => {
          matrix.push({
            serviceId: s.id,
            size: size as VehicleSize,
            price: Number(price)
          });
        });

        const cons = priceMatrixData.consumption;
        if (cons) {
             consumptions.push({ serviceId: s.id, items: cons });
        }
      });
      
      setPriceMatrix(matrix);
      setServiceConsumptions(consumptions);
    }
  };
  const fetchEmployees = async (tId: string) => {
    const { data } = await supabase.from('employees').select('*').eq('tenant_id', tId);
    if (data) {
      setEmployees(data.map(e => {
        const salaryData = e.salary_data as any || {};
        return {
          id: e.id,
          name: e.name,
          role: e.role as any,
          pin: e.pin,
          active: e.active,
          balance: e.balance,
          salaryType: salaryData.salaryType || 'commission',
          fixedSalary: salaryData.fixedSalary || 0,
          commissionRate: salaryData.commissionRate || 0,
          commissionBase: salaryData.commissionBase || 'net'
        };
      }));
    }
  };
  const fetchFinancials = async (tId: string) => {
    const { data } = await supabase.from('financial_transactions').select('*').eq('tenant_id', tId).order('date', { ascending: false });
    if (data) {
      setFinancialTransactions(data.map(t => ({
        id: t.id,
        desc: t.description,
        category: t.category,
        amount: t.amount,
        netAmount: t.amount,
        fee: 0,
        type: t.type as any,
        date: t.date,
        dueDate: t.date,
        method: t.method,
        status: t.status as any
      })));
    }
  };
  const fetchGamificationData = async (tId: string) => {
    const { data: rewardsData } = await supabase.from('rewards').select('*').eq('tenant_id', tId);
    if (rewardsData) {
        setRewards(rewardsData.map(r => {
            const config = r.config as any || {};
            return {
                id: r.id,
                name: r.name,
                description: r.description,
                requiredPoints: r.required_points,
                requiredLevel: r.required_level as TierLevel,
                rewardType: r.reward_type as any,
                active: r.active,
                createdAt: r.created_at,
                percentage: config.percentage,
                gift: config.gift,
                value: config.value
            };
        }));
    }
    const { data: redemptionsData } = await supabase.from('redemptions').select('*').eq('tenant_id', tId);
    if (redemptionsData) {
        setRedemptions(redemptionsData.map(r => ({
            id: r.id,
            clientId: r.client_id,
            rewardId: r.reward_id,
            rewardName: r.reward_name,
            code: r.code,
            pointsCost: r.points_cost,
            status: r.status as any,
            redeemedAt: r.redeemed_at,
            usedAt: r.used_at || undefined
        })));
    }
    const { data: cardsData } = await supabase.from('fidelity_cards').select('*').eq('tenant_id', tId);
    if (cardsData) {
        setFidelityCards(cardsData.map(c => ({
            clientId: c.client_id,
            cardNumber: c.card_number,
            cardHolder: '', 
            cardColor: 'blue',
            qrCode: '',
            expiresAt: '2030-01-01',
            issueDate: c.created_at
        })));
    }
    const { data: historyData } = await supabase.from('points_history').select('*').eq('tenant_id', tId);
    if (historyData) {
        setPointsHistory(historyData);
    }
  };

  const fetchCampaigns = async (tId: string) => {
    const { data } = await supabase.from('marketing_campaigns').select('*').eq('tenant_id', tId);
    if (data) {
        setCampaigns(data.map(c => ({
            id: c.id,
            name: c.name,
            targetSegment: c.target_segment as any,
            messageTemplate: c.message_template || '',
            sentCount: c.sent_count,
            conversionCount: c.conversion_count,
            revenueGenerated: c.revenue_generated,
            costInTokens: c.cost_in_tokens,
            status: c.status as any,
            date: c.date
        })));
    }
  };

  const updateCompanySettings = async (settings: Partial<CompanySettings>) => {
    const newSettings = { ...companySettings, ...settings };
    setCompanySettings(newSettings);
    
    if (settings.name && ownerUser) {
        setOwnerUser({ ...ownerUser, shopName: settings.name });
    }
    
    if (tenantId) {
        const payload: any = { settings: newSettings };
        if (settings.slug) payload.slug = settings.slug;
        if (settings.name) payload.name = settings.name;

        const { error } = await supabase
            .from('tenants')
            .update(payload)
            .eq('id', tenantId);
            
        if (error) console.error("Error saving settings:", error);
    }
  };

  // ... (CRUD Operations) ...
  const addWorkOrder = async (os: WorkOrder): Promise<boolean> => {
    if (!tenantId) return false;
    const tempId = os.id;
    setWorkOrders(prev => [os, ...prev]);
    const payload = {
        tenant_id: tenantId,
        client_id: os.clientId,
        vehicle_plate: os.plate,
        service_summary: os.service,
        status: os.status,
        total_value: os.totalValue,
        technician: os.technician,
        deadline: os.deadline,
        payment_status: os.paymentStatus || 'pending',
        payment_method: os.paymentMethod,
        nps_score: os.npsScore,
        json_data: {
            vehicle: os.vehicle,
            damages: os.damages,
            vehicleInventory: os.vehicleInventory,
            dailyLog: os.dailyLog,
            qaChecklist: os.qaChecklist,
            tasks: os.tasks,
            checklist: os.checklist,
            additionalItems: os.additionalItems,
            discount: os.discount,
            scopeChecklist: os.scopeChecklist,
            serviceIds: os.serviceIds,
            clientSignature: os.clientSignature
        }
    };
    try {
        const { data, error } = await supabase.from('work_orders').insert(payload).select().single();
        if (error) {
            console.error("Error adding OS:", error);
            setWorkOrders(prev => prev.filter(o => o.id !== tempId));
            return false;
        } 
        if (data) {
            setWorkOrders(prev => prev.map(o => o.id === tempId ? { ...o, id: data.id } : o));
            return true;
        }
    } catch (err) {
        console.error("Exception adding OS:", err);
        setWorkOrders(prev => prev.filter(o => o.id !== tempId));
        return false;
    }
    return false;
  };

  const updateWorkOrder = async (id: string, updates: Partial<WorkOrder>): Promise<boolean> => {
    if (!tenantId) return false;
    
    const originalOrder = workOrders.find(o => o.id === id);
    if (!originalOrder) return false;
    setWorkOrders(prev => prev.map(os => os.id === id ? { ...os, ...updates } : os));
    const currentOS = { ...originalOrder, ...updates };
    const payload: any = {};
    if (updates.status) payload.status = updates.status;
    if (updates.totalValue !== undefined) payload.total_value = updates.totalValue;
    if (updates.paymentStatus) payload.payment_status = updates.paymentStatus;
    if (updates.paymentMethod) payload.payment_method = updates.paymentMethod;
    if (updates.npsScore !== undefined) payload.nps_score = updates.npsScore;
    if (updates.technician !== undefined) payload.technician = updates.technician; // Ensure technician update persists
    
    payload.json_data = {
        vehicle: currentOS.vehicle,
        damages: currentOS.damages,
        vehicleInventory: currentOS.vehicleInventory,
        dailyLog: currentOS.dailyLog,
        qaChecklist: currentOS.qaChecklist,
        tasks: currentOS.tasks,
        checklist: currentOS.checklist,
        additionalItems: currentOS.additionalItems,
        discount: currentOS.discount,
        scopeChecklist: currentOS.scopeChecklist,
        serviceIds: currentOS.serviceIds,
        clientSignature: currentOS.clientSignature
    };
    const { error } = await supabase.from('work_orders').update(payload).eq('id', id);
    return !error;
  };

  const completeWorkOrder = (id: string, orderSnapshot?: WorkOrder) => {
      if (!tenantId) return;
      const os = orderSnapshot || workOrders.find(o => o.id === id);
      if (!os) return;
      
      updateWorkOrder(id, { status: 'Concluído' });
      
      if (os.serviceIds) os.serviceIds.forEach(svcId => deductStock(svcId));
      else if (os.serviceId) deductStock(os.serviceId);
      
      if (os.clientId && companySettings.gamification.enabled) {
          const points = Math.floor(os.totalValue * (companySettings.gamification.pointsMultiplier || 1));
          addPointsToClient(os.clientId, os.id, points, `Serviço: ${os.service}`);
      }
      
      if (os.clientId) {
          updateClientVisits(os.clientId, 1);
          updateClientLTV(os.clientId, os.totalValue);
      }

      // --- AUTOMATIC COMMISSION LOGIC ---
      if (os.technician && os.technician !== 'A Definir') {
          const employee = employees.find(e => e.name === os.technician);
          
          if (employee && employee.active && (employee.salaryType === 'commission' || employee.salaryType === 'mixed')) {
              // Calculate Commission
              // If commissionBase is 'net', ideally we should subtract costs, but for now we use totalValue as simplified base
              // or implement cost subtraction if cost data is readily available.
              // Assuming 'gross' for simplicity unless we have robust cost tracking per OS.
              
              const commissionValue = (os.totalValue * employee.commissionRate) / 100;
              
              if (commissionValue > 0) {
                  const newBalance = (employee.balance || 0) + commissionValue;
                  
                  // Update Employee Balance in DB
                  updateEmployee(employee.id, { balance: newBalance });
                  
                  // Log Transaction (In-memory for now as we don't have employee_transactions table, 
                  // but we update the balance which is persistent)
                  const transaction: EmployeeTransaction = {
                      id: `comm-${Date.now()}`,
                      employeeId: employee.id,
                      type: 'commission',
                      amount: commissionValue,
                      description: `Comissão OS #${formatId(os.id)}`,
                      date: new Date().toISOString(),
                      relatedWorkOrderId: os.id
                  };
                  addEmployeeTransaction(transaction);
                  
                  console.log(`Commission of ${commissionValue} credited to ${employee.name}`);
              }
          }
      }
  };

  // ... (Other CRUD functions remain the same) ...
  const addClient = async (client: Partial<Client>): Promise<Client | null> => {
    if (!tenantId) return null;
    const addressData = { cep: client.cep, street: client.street, number: client.number, neighborhood: client.neighborhood, city: client.city, state: client.state, formatted: client.address };
    const { data, error } = await supabase.from('clients').insert({ tenant_id: tenantId, name: client.name || 'Novo Cliente', phone: client.phone || '', email: client.email, address_data: addressData, ltv: 0, visit_count: 0, status: 'active', segment: 'new', notes: client.notes }).select().single();
    if (data) {
        const newClient: Client = { id: data.id, name: data.name, phone: data.phone, email: data.email || '', ...addressData, address: addressData.formatted, notes: data.notes || '', vehicles: [], ltv: 0, visitCount: 0, lastVisit: new Date().toISOString(), status: 'active', segment: 'new' };
        setClients(prev => [...prev, newClient]);
        return newClient;
    }
    return null;
  };
  const updateClient = async (id: string, updates: Partial<Client>) => {
    if (!tenantId) return;
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.phone) payload.phone = updates.phone;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.ltv !== undefined) payload.ltv = updates.ltv;
    if (updates.visitCount !== undefined) payload.visit_count = updates.visitCount;
    if (updates.lastVisit) payload.last_visit = updates.lastVisit;
    if (updates.cep || updates.street || updates.address) {
        const current = clients.find(c => c.id === id);
        payload.address_data = { cep: updates.cep || current?.cep, street: updates.street || current?.street, number: updates.number || current?.number, neighborhood: updates.neighborhood || current?.neighborhood, city: updates.city || current?.city, state: updates.state || current?.state, formatted: updates.address || current?.address };
    }
    await supabase.from('clients').update(payload).eq('id', id);
  };
  const deleteClient = async (id: string) => { if (!tenantId) return; setClients(prev => prev.filter(c => c.id !== id)); await supabase.from('clients').delete().eq('id', id); };
  const addVehicle = async (clientId: string, vehicle: Partial<Vehicle>) => {
    if (!tenantId) return;
    const { data } = await supabase.from('vehicles').insert({ tenant_id: tenantId, client_id: clientId, model: vehicle.model || '', plate: vehicle.plate || '', color: vehicle.color || '', year: vehicle.year || '', size: vehicle.size || 'medium' }).select().single();
    if (data) {
        const newVehicle: Vehicle = { id: data.id, model: data.model, plate: data.plate, color: data.color, year: data.year, size: data.size as VehicleSize };
        setClients(prev => prev.map(c => { if (c.id === clientId) { return { ...c, vehicles: [...c.vehicles, newVehicle] }; } return c; }));
    }
  };
  const updateVehicle = async (clientId: string, vehicle: Vehicle) => { if (!tenantId) return; setClients(prev => prev.map(c => { if (c.id === clientId) { return { ...c, vehicles: c.vehicles.map(v => v.id === vehicle.id ? vehicle : v) }; } return c; })); await supabase.from('vehicles').update({ model: vehicle.model, plate: vehicle.plate, color: vehicle.color, year: vehicle.year, size: vehicle.size }).eq('id', vehicle.id); };
  const removeVehicle = async (clientId: string, vehicleId: string) => { if (!tenantId) return; setClients(prev => prev.map(c => { if (c.id === clientId) { return { ...c, vehicles: c.vehicles.filter(v => v.id !== vehicleId) }; } return c; })); await supabase.from('vehicles').delete().eq('id', vehicleId); };
  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'status'>) => { 
      if (!tenantId) return; const { data } = await supabase.from('inventory').insert({ tenant_id: tenantId, name: item.name, category: item.category, stock: item.stock, unit: item.unit, min_stock: item.min_stock, cost_price: item.costPrice, status: 'ok' }).select().single(); if (data) setInventory(prev => [...prev, { ...item, id: data.id, status: 'ok' }]); 
  };
  const updateInventoryItem = async (id: number, updates: Partial<InventoryItem>) => { if (!tenantId) return; setInventory(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i)); const payload: any = {}; if (updates.name) payload.name = updates.name; if (updates.stock !== undefined) payload.stock = updates.stock; if (updates.minStock !== undefined) payload.min_stock = updates.minStock; if (updates.costPrice !== undefined) payload.cost_price = updates.costPrice; const item = inventory.find(i => i.id === id); if (item && updates.stock !== undefined) { const min = updates.minStock !== undefined ? updates.minStock : item.minStock; if (updates.stock <= min) payload.status = 'critical'; else if (updates.stock <= min * 1.5) payload.status = 'warning'; else payload.status = 'ok'; } await supabase.from('inventory').update(payload).eq('id', id); };
  const deleteInventoryItem = async (id: number) => { if (!tenantId) return; setInventory(prev => prev.filter(i => i.id !== id)); await supabase.from('inventory').delete().eq('id', id); };
  const deductStock = (serviceId: string) => { const consumption = serviceConsumptions.find(c => c.serviceId === serviceId); if (consumption) { consumption.items.forEach(item => { const invItem = inventory.find(i => i.id === item.inventoryId); if (invItem) { const newStock = Math.max(0, invItem.stock - item.quantity); updateInventoryItem(invItem.id, { stock: newStock }); } }); } };
  const addService = async (service: Partial<ServiceCatalogItem>) => { 
      if (!tenantId) return; const newId = generateUUID(); const priceMatrixData = { prices: {}, consumption: [], returnIntervalDays: service.returnIntervalDays || 0, imageUrl: service.imageUrl || '', showOnLandingPage: service.showOnLandingPage ?? true }; const { error } = await supabase.from('services').insert({ id: newId, tenant_id: tenantId, name: service.name || 'Novo Serviço', category: service.category || 'Geral', description: service.description, standard_time: service.standardTimeMinutes || 60, active: service.active ?? true, price_matrix: priceMatrixData }); if (!error) setServices(prev => [...prev, { ...service, id: newId } as ServiceCatalogItem]); 
  };
  const updateService = async (id: string, updates: Partial<ServiceCatalogItem>) => { if (!tenantId) return; setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s)); const payload: any = {}; if (updates.name) payload.name = updates.name; if (updates.category) payload.category = updates.category; if (updates.description !== undefined) payload.description = updates.description; if (updates.standardTimeMinutes !== undefined) payload.standard_time = updates.standardTimeMinutes; if (updates.active !== undefined) payload.active = updates.active; if (updates.returnIntervalDays !== undefined || updates.imageUrl !== undefined || updates.showOnLandingPage !== undefined) { const currentService = services.find(s => s.id === id); const { data } = await supabase.from('services').select('price_matrix').eq('id', id).single(); const currentMatrix = data?.price_matrix as any || {}; payload.price_matrix = { ...currentMatrix, returnIntervalDays: updates.returnIntervalDays ?? currentService?.returnIntervalDays, imageUrl: updates.imageUrl ?? currentService?.imageUrl, showOnLandingPage: updates.showOnLandingPage ?? currentService?.showOnLandingPage }; } await supabase.from('services').update(payload).eq('id', id); };
  const deleteService = async (id: string) => { if (!tenantId) return; setServices(prev => prev.filter(s => s.id !== id)); await supabase.from('services').delete().eq('id', id); };
  const updatePrice = (serviceId: string, size: VehicleSize, newPrice: number) => { setPriceMatrix(prev => { const existing = prev.find(p => p.serviceId === serviceId && p.size === size); if (existing) { return prev.map(p => p.serviceId === serviceId && p.size === size ? { ...p, price: newPrice } : p); } return [...prev, { serviceId, size, price: newPrice }]; }); const key = `${serviceId}-${size}`; pendingPriceUpdates.current[key] = { serviceId, size, price: newPrice }; if (priceUpdateTimeoutRef.current) clearTimeout(priceUpdateTimeoutRef.current); priceUpdateTimeoutRef.current = setTimeout(async () => { if (!tenantId) return; const updates = { ...pendingPriceUpdates.current }; pendingPriceUpdates.current = {}; const updatesByService: Record<string, Record<string, number>> = {}; Object.values(updates).forEach(u => { if (!updatesByService[u.serviceId]) updatesByService[u.serviceId] = {}; updatesByService[u.serviceId][u.size] = u.price; }); for (const [sId, pricesToUpdate] of Object.entries(updatesByService)) { try { const { data } = await supabase.from('services').select('price_matrix').eq('id', sId).single(); if (data) { const matrix = data.price_matrix as any || {}; const currentPrices = matrix.prices || {}; const newPrices = { ...currentPrices, ...pricesToUpdate }; await supabase.from('services').update({ price_matrix: { ...matrix, prices: newPrices } }).eq('id', sId); } } catch (err) { console.error("Error saving prices for service", sId, err); } } }, 1000); };
  const updateServiceInterval = (serviceId: string, days: number) => { updateService(serviceId, { returnIntervalDays: days }); };
  const updateServiceConsumption = async (consumption: ServiceConsumption): Promise<boolean> => { setServiceConsumptions(prev => { const existing = prev.findIndex(c => c.serviceId === consumption.serviceId); if (existing >= 0) { const newArr = [...prev]; newArr[existing] = consumption; return newArr; } return [...prev, consumption]; }); if (tenantId) { try { const { data } = await supabase.from('services').select('price_matrix').eq('id', consumption.serviceId).single(); const matrix = data?.price_matrix as any || {}; const { error } = await supabase.from('services').update({ price_matrix: { ...matrix, consumption: consumption.items } }).eq('id', consumption.serviceId); return !error; } catch (err) { console.error("Error saving consumption:", err); return false; } } return false; };
  const updateClientLTV = (clientId: string, amount: number) => { const client = clients.find(c => c.id === clientId); if (client) { updateClient(clientId, { ltv: (client.ltv || 0) + amount }); } };
  const updateClientVisits = (clientId: string, amount: number) => { const client = clients.find(c => c.id === clientId); if (client) { updateClient(clientId, { visitCount: (client.visitCount || 0) + amount }); } };
  const submitNPS = (workOrderId: string, score: number, comment?: string) => { updateWorkOrder(workOrderId, { npsScore: score, npsComment: comment }); };
  const addReward = async (reward: Omit<Reward, 'id' | 'createdAt'>) => { if (!tenantId) return; const config = { percentage: reward.percentage, gift: reward.gift, value: reward.value }; const { data } = await supabase.from('rewards').insert({ tenant_id: tenantId, name: reward.name, description: reward.description, required_points: reward.requiredPoints, required_level: reward.requiredLevel, reward_type: reward.rewardType, config, active: reward.active }).select().single(); if (data) { setRewards(prev => [...prev, { ...reward, id: data.id, createdAt: data.created_at }]); } };
  const updateReward = async (id: string, updates: Partial<Reward>) => { if (!tenantId) return; const { percentage, gift, value, ...rest } = updates; await supabase.from('rewards').update({ name: rest.name, description: rest.description, required_points: rest.requiredPoints, required_level: rest.requiredLevel, reward_type: rest.rewardType, active: rest.active, }).eq('id', id); setRewards(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r)); };
  const deleteReward = async (id: string) => { if (!tenantId) return; await supabase.from('rewards').delete().eq('id', id); setRewards(prev => prev.filter(r => r.id !== id)); };
  const recalculateClientMetrics = (clientId: string) => {
      // Placeholder for manual recalculation if needed
      // Logic is already embedded in fetchClients for dynamic updates
  };

  const createFidelityCard = async (clientId: string): Promise<FidelityCard> => {
    const dummyCard: FidelityCard = { clientId, cardNumber: '', cardHolder: '', cardColor: 'blue', qrCode: '', expiresAt: '', issueDate: '' };
    if (!tenantId) return dummyCard;

    const existing = fidelityCards.find(c => c.clientId === clientId);
    if (existing) return existing;

    const cardNumber = Math.random().toString().slice(2, 18);
    const { data, error } = await supabase.from('fidelity_cards').insert({
        tenant_id: tenantId,
        client_id: clientId,
        card_number: cardNumber
    }).select().single();

    if (data) {
        const newCard: FidelityCard = {
            clientId,
            cardNumber: data.card_number,
            cardHolder: clients.find(c => c.id === clientId)?.name || 'Cliente',
            cardColor: 'blue',
            qrCode: '',
            expiresAt: '2030-01-01',
            issueDate: data.created_at
        };
        setFidelityCards(prev => [...prev, newCard]);
        return newCard;
    }

    if (error && error.code === '23505') { 
         const { data: existingData } = await supabase.from('fidelity_cards').select('*').eq('client_id', clientId).single();
         if (existingData) {
             const recoveredCard: FidelityCard = {
                clientId,
                cardNumber: existingData.card_number,
                cardHolder: clients.find(c => c.id === clientId)?.name || 'Cliente',
                cardColor: 'blue',
                qrCode: '',
                expiresAt: '2030-01-01',
                issueDate: existingData.created_at
            };
            setFidelityCards(prev => {
                if (prev.some(c => c.clientId === clientId)) return prev;
                return [...prev, recoveredCard];
            });
            return recoveredCard;
         }
    }
    return dummyCard;
  };

  const addPointsToClient = async (clientId: string, workOrderId: string, points: number, description: string) => { if (!tenantId) return; const { data } = await supabase.from('points_history').insert({ tenant_id: tenantId, client_id: clientId, points, description, type: workOrderId === 'manual' ? 'manual' : 'service' }).select().single(); if (data) { setPointsHistory(prev => [...prev, data]); } };
  const claimReward = (clientId: string, rewardId: string) => { const reward = rewards.find(r => r.id === rewardId); if (!reward) return { success: false, message: 'Recompensa não encontrada' }; const points = getClientPoints(clientId); if (!points || points.totalPoints < reward.requiredPoints) { return { success: false, message: 'Pontos insuficientes' }; } const code = Math.random().toString(36).substring(2, 8).toUpperCase(); const newRedemption: Redemption = { id: `red-${Date.now()}`, clientId, rewardId, rewardName: reward.name, code, pointsCost: reward.requiredPoints, status: 'active', redeemedAt: new Date().toISOString() }; setRedemptions(prev => [...prev, newRedemption]); if (tenantId) { supabase.from('redemptions').insert({ tenant_id: tenantId, client_id: clientId, reward_id: rewardId, reward_name: reward.name, code, points_cost: reward.requiredPoints, status: 'active' }).then(() => {}); } return { success: true, message: 'Resgate realizado com sucesso!', voucherCode: code }; };
  const getClientPoints = (clientId: string): ClientPoints | undefined => { const client = clients.find(c => c.id === clientId); if (!client) return undefined; const multiplier = companySettings.gamification.pointsMultiplier || 1; const ltvPoints = Math.floor((client.ltv || 0) * multiplier); const clientHistory = pointsHistory.filter(h => h.client_id === clientId); const manualPoints = clientHistory.reduce((acc, h) => acc + (h.points || 0), 0); const clientRedemptions = redemptions.filter(r => r.clientId === clientId); const spentPoints = clientRedemptions.reduce((acc, r) => acc + r.pointsCost, 0); const totalPoints = ltvPoints + manualPoints - spentPoints; const tiers = companySettings.gamification.tiers || defaultTiers; let currentTier: TierLevel = 'bronze'; let currentLevel = 1; const sortedTiers = [...tiers].sort((a, b) => b.minPoints - a.minPoints); const matchedTier = sortedTiers.find(t => totalPoints >= t.minPoints); if (matchedTier) { currentTier = matchedTier.id; currentLevel = tiers.findIndex(t => t.id === matchedTier.id) + 1; } return { clientId, totalPoints: Math.max(0, totalPoints), currentLevel, tier: currentTier, lastServiceDate: client.lastVisit, servicesCompleted: client.visitCount, pointsHistory: clientHistory.map(h => ({ id: h.id, workOrderId: h.type, points: h.points, description: h.description, date: h.created_at })) }; };
  const updateTierConfig = (tiers: TierConfig[]) => { updateCompanySettings({ gamification: { ...companySettings.gamification, tiers } }); };
  const getRewardsByLevel = (level: TierLevel) => { const levels = ['bronze', 'silver', 'gold', 'platinum']; const userLevelIdx = levels.indexOf(level); return rewards.filter(r => r.active && levels.indexOf(r.requiredLevel) <= userLevelIdx); };
  const getClientRedemptions = (clientId: string) => redemptions.filter(r => r.clientId === clientId);
  const getFidelityCard = (clientId: string) => { const card = fidelityCards.find(c => c.clientId === clientId); if (card) { const client = clients.find(c => c.id === clientId); return { ...card, cardHolder: client?.name || 'Cliente' }; } return undefined; };
  const useVoucher = (code: string, workOrderId: string) => { const redemption = redemptions.find(r => r.code === code && r.status === 'active'); if (redemption) { setRedemptions(prev => prev.map(r => r.id === redemption.id ? { ...r, status: 'used', usedAt: new Date().toISOString(), usedInWorkOrderId: workOrderId } : r)); if (tenantId) { supabase.from('redemptions').update({ status: 'used', used_at: new Date().toISOString() }).eq('id', redemption.id); } return true; } return false; };
  const getVoucherDetails = (code: string) => { const redemption = redemptions.find(r => r.code === code); if (!redemption) return null; const reward = rewards.find(r => r.id === redemption.rewardId); return { redemption, reward }; };
  const addEmployee = (employee: Omit<Employee, 'id' | 'balance'>) => { if (!tenantId) return; const { name, role, pin, salaryType, fixedSalary, commissionRate, commissionBase, active } = employee; const salaryData = { salaryType, fixedSalary, commissionRate, commissionBase }; supabase.from('employees').insert({ tenant_id: tenantId, name, role, pin, salary_data: salaryData, active, balance: 0 }).then(({ data, error }) => { if (!error) fetchEmployees(tenantId); }); };
  const updateEmployee = (id: string, updates: Partial<Employee>) => { if (!tenantId) return; const { name, role, pin, salaryType, fixedSalary, commissionRate, commissionBase, active, balance } = updates; const payload: any = {}; if (name) payload.name = name; if (role) payload.role = role; if (pin) payload.pin = pin; if (active !== undefined) payload.active = active; if (balance !== undefined) payload.balance = balance; if (salaryType || fixedSalary !== undefined || commissionRate !== undefined || commissionBase) { const current = employees.find(e => e.id === id); const salaryData = { salaryType: salaryType || current?.salaryType, fixedSalary: fixedSalary !== undefined ? fixedSalary : current?.fixedSalary, commissionRate: commissionRate !== undefined ? commissionRate : current?.commissionRate, commissionBase: commissionBase || current?.commissionBase }; payload.salary_data = salaryData; } supabase.from('employees').update(payload).eq('id', id).then(({ error }) => { if (!error) fetchEmployees(tenantId); }); };
  const deleteEmployee = (id: string) => { if (!tenantId) return; supabase.from('employees').delete().eq('id', id).then(({ error }) => { if (!error) setEmployees(prev => prev.filter(e => e.id !== id)); }); };
  const addEmployeeTransaction = (trans: EmployeeTransaction) => { setEmployeeTransactions(prev => [...prev, trans]); };
  const updateEmployeeTransaction = (id: string, updates: Partial<EmployeeTransaction>) => { setEmployeeTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t)); };
  const deleteEmployeeTransaction = (id: string) => { setEmployeeTransactions(prev => prev.filter(t => t.id !== id)); };
  const addFinancialTransaction = (trans: FinancialTransaction) => { if (!tenantId) return; supabase.from('financial_transactions').insert({ tenant_id: tenantId, description: trans.desc, category: trans.category, amount: trans.amount, type: trans.type, date: trans.date, method: trans.method, status: trans.status }).then(({ error }) => { if (!error) fetchFinancials(tenantId); }); };
  const updateFinancialTransaction = (id: number, updates: Partial<FinancialTransaction>) => { if (!tenantId) return; const payload: any = {}; if (updates.desc) payload.description = updates.desc; if (updates.category) payload.category = updates.category; if (updates.amount !== undefined) payload.amount = updates.amount; if (updates.type) payload.type = updates.type; if (updates.date) payload.date = updates.date; if (updates.method) payload.method = updates.method; if (updates.status) payload.status = updates.status; supabase.from('financial_transactions').update(payload).eq('id', id).then(({ error }) => { if (!error) fetchFinancials(tenantId); }); };
  const deleteFinancialTransaction = (id: number) => { if (!tenantId) return; supabase.from('financial_transactions').delete().eq('id', id).then(({ error }) => { if (!error) fetchFinancials(tenantId); }); };
  
  // --- MARKETING PERSISTENCE ---
  const createCampaign = async (campaign: MarketingCampaign) => { 
      if (!tenantId) return; 
      const { data, error } = await supabase.from('marketing_campaigns').insert({
          tenant_id: tenantId,
          name: campaign.name,
          target_segment: campaign.targetSegment,
          message_template: campaign.messageTemplate,
          sent_count: campaign.sentCount,
          conversion_count: 0,
          revenue_generated: 0,
          cost_in_tokens: campaign.costInTokens,
          status: 'sent',
          date: new Date().toISOString()
      }).select().single();

      if (data) {
          setCampaigns(prev => [...prev, {
              id: data.id,
              name: data.name,
              targetSegment: data.target_segment as any,
              messageTemplate: data.message_template || '',
              sentCount: data.sent_count,
              conversionCount: data.conversion_count,
              revenueGenerated: data.revenue_generated,
              costInTokens: data.cost_in_tokens,
              status: data.status as any,
              date: data.date
          }]);
      }
  };
  
  const updateCampaign = async (id: string, updates: Partial<MarketingCampaign>) => { 
      if (!tenantId) return; 
      
      const payload: any = {};
      if (updates.conversionCount !== undefined) payload.conversion_count = updates.conversionCount;
      if (updates.revenueGenerated !== undefined) payload.revenue_generated = updates.revenueGenerated;
      
      const { error } = await supabase.from('marketing_campaigns').update(payload).eq('id', id);
      
      if (!error) {
          setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c)); 
      }
  };

  return (
    <AppContext.Provider value={{ 
      // ... (Keep existing exports) ...
      inventory, workOrders, clients, recipes, reminders, services, priceMatrix, theme,
      employees, employeeTransactions, currentUser, ownerUser, campaigns, clientPoints, fidelityCards, rewards, redemptions,
      companySettings, subscription, updateCompanySettings,
      financialTransactions,
      
      // NEW: Alerts
      systemAlerts,
      markAlertResolved,

      login: (pin) => { const e = employees.find(emp => emp.pin === pin && emp.active); if(e) { setCurrentUser(e); return true; } return false; }, 
      logout: () => setCurrentUser(null),
      
      loginOwner: async (e, p) => { 
        const email = e.replace(/\s+/g, '').toLowerCase();
        const password = p; 
        
        console.log(`Attempting loginOwner for: '${email}' (Pass len: ${password.length})`);
        
        try {
          let { error } = await supabase.auth.signInWithPassword({ email, password });

          if (error && error.code === 'invalid_credentials' && password.trim() !== password) {
             console.log("Login failed with raw password, trying trimmed...");
             const retryResult = await supabase.auth.signInWithPassword({ email, password: password.trim() });
             if (!retryResult.error) error = null;
          }

          if (error) {
            console.error("Supabase Login Error:", error);
            const errorCode = (error as any).code || error.status?.toString();
            return { success: false, error: { message: error.message, code: errorCode } };
          }
          console.log("Supabase Login Success");
          return { success: true }; 
        } catch (err: any) {
          console.error("Login Exception:", err);
          return { success: false, error: { message: err.message || "Erro desconhecido" } };
        }
      },
      
      registerOwner: async (n, e, s, p) => { 
        const { error } = await supabase.auth.signUp({ 
            email: e.replace(/\s+/g, '').toLowerCase(), 
            password: p.trim(),
            options: { data: { name: n.trim(), shop_name: s.trim() } } 
        }); 
        return { success: !error, error: error?.message }; 
      },
      logoutOwner: async () => { 
          try {
              await supabase.auth.signOut(); 
          } catch (error) {
              console.warn("Supabase signOut failed (network error?), clearing local session anyway.", error);
          }
          setOwnerUser(null); 
          setTenantId(null); 
      },
      createTenant, 
      createTenantViaRPC: async (name: string) => { return true; }, 
      reloadUserData: async () => { 
        console.log("Reloading user data...");
        try {
          if (ownerUser?.id) {
            return await loadTenantData(ownerUser.id, ownerUser.email);
          }
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;

          if (session?.user) {
              return await loadTenantData(session.user.id, session.user.email || '');
          }
        } catch (error: any) {
          console.error("Reload data error:", error);
          if (error?.code === 'refresh_token_not_found') {
              await supabase.auth.signOut();
              setOwnerUser(null);
          }
        }
        console.warn("No session found during reloadUserData");
        return false;
      },
      addWorkOrder, updateWorkOrder, completeWorkOrder, recalculateClientMetrics, updateClientLTV, updateClientVisits, submitNPS: () => {},
      addClient, updateClient, deleteClient, addVehicle, updateVehicle, removeVehicle,
      addInventoryItem, updateInventoryItem, deleteInventoryItem, deductStock,
      toggleTheme: () => setTheme(prev => prev === 'dark' ? 'light' : 'dark'), generateReminders: () => {},
      updatePrice, updateServiceInterval, bulkUpdatePrices: () => {}, getPrice: (sId, size) => priceMatrix.find(p => p.serviceId === sId && p.size === size)?.price || 0, 
      addService, updateService, deleteService,
      assignTask: () => {}, startTask: () => {}, stopTask: () => {}, addEmployeeTransaction, updateEmployeeTransaction, deleteEmployeeTransaction,
      addEmployee, updateEmployee, deleteEmployee,
      addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction,
      createCampaign, updateCampaign, getWhatsappLink: (p, m) => `https://wa.me/${p}?text=${encodeURIComponent(m)}`,
      connectWhatsapp: () => {}, disconnectWhatsapp: () => {},
      addPointsToClient, getClientPoints, createFidelityCard, getFidelityCard,
      addReward, updateReward, deleteReward, getRewardsByLevel,
      updateTierConfig, generatePKPass: () => '', generateGoogleWallet: () => '', claimReward, getClientRedemptions, useVoucher, getVoucherDetails,
      notifications, markNotificationAsRead: () => {}, clearAllNotifications: () => {}, addNotification: () => {},
      updateServiceConsumption, getServiceConsumption: (sId) => serviceConsumptions.find(c => c.serviceId === sId), calculateServiceCost: (sId) => {
          const consumption = serviceConsumptions.find(c => c.serviceId === sId);
          if (!consumption) return 0;
          return consumption.items.reduce((total, item) => {
              const invItem = inventory.find(i => i.id === item.inventoryId);
              return total + (invItem ? invItem.costPrice * item.quantity : 0);
          }, 0);
      }, serviceConsumptions,
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
