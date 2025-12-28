import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { 
  Client, InventoryItem, WorkOrder, ServiceRecipe, Reminder, Vehicle, 
  ServiceCatalogItem, PriceMatrixEntry, VehicleSize, Employee, Task, 
  EmployeeTransaction, MarketingCampaign,
  CompanySettings, SubscriptionDetails, FinancialTransaction, ClientPoints, FidelityCard, Reward,
  Redemption, TierConfig, TierLevel, ShopOwner, Notification, ServiceConsumption, AuthResponse,
  SystemAlert, SocialPost, CustomAutomation, MessageLog, VEHICLE_SIZES, PaymentRate, SupportTicket
} from '../types';
import { addDays, formatISO, isAfter } from 'date-fns';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { isValidUUID, generateUUID, formatId } from '../lib/utils';
import { MOCK_ALERTS, MOCK_REWARDS } from '../lib/mockData';
import { CAMPAIGN_TEMPLATES } from '../services/campaignService';
import { DEFAULT_TERMS, DEFAULT_PRIVACY } from '../lib/legalDefaults';
import { whatsappService } from '../services/whatsapp';

// Initial Settings
export const initialCompanySettings: CompanySettings = {
  name: 'Minha Oficina',
  slug: '',
  responsibleName: '',
  cnpj: '',
  email: '',
  phone: '',
  address: '',
  logoUrl: '',
  initialBalance: 0,
  hourlyRate: 50,
  monthlyGoal: 20000,
  paymentRates: [],
  whatsapp: {
    enabled: false,
    session: { status: 'disconnected' },
    templates: {
      welcome: 'Olá {cliente}, bem-vindo à {empresa}!',
      completion: 'Olá {cliente}, seu serviço no veículo {veiculo} foi concluído.',
      nps: 'Olá {cliente}, como avalia nosso serviço de 0 a 10?',
      recall: 'Olá {cliente}, faz tempo que não vemos seu {veiculo}. Que tal agendar uma visita?',
      birthday: 'Parabéns {cliente}! Temos um presente para você.',
      appointmentReminder: 'Lembrete: Seu agendamento é amanhã às {horario}.',
      reviewRequest: 'Gostou do serviço? Avalie-nos no Google!'
    }
  },
  landingPage: {
    enabled: true,
    heroTitle: 'Estética Automotiva Premium',
    heroSubtitle: 'Cuidado e proteção para seu veículo.',
    heroImage: '',
    primaryColor: '#3b82f6',
    showServices: true,
    showTestimonials: true,
    whatsappMessage: 'Olá, gostaria de agendar um serviço.'
  },
  preferences: {
    theme: 'light',
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
    enabled: false,
    levelSystem: true,
    pointsMultiplier: 1,
    tiers: []
  }
};

interface AppContextType {
  // State
  clients: Client[];
  inventory: InventoryItem[];
  workOrders: WorkOrder[];
  services: ServiceCatalogItem[];
  priceMatrix: PriceMatrixEntry[];
  employees: Employee[];
  employeeTransactions: EmployeeTransaction[];
  financialTransactions: FinancialTransaction[];
  reminders: Reminder[];
  campaigns: MarketingCampaign[];
  companySettings: CompanySettings;
  subscription: SubscriptionDetails;
  notifications: Notification[];
  ownerUser: ShopOwner | null;
  systemAlerts: SystemAlert[];
  clientPoints: ClientPoints[];
  socialPosts: SocialPost[];
  messageLogs: MessageLog[];
  theme: 'light' | 'dark';
  isAppLoading: boolean;
  tenantId: string | null;
  supportTickets: SupportTicket[];

  // Actions
  addClient: (client: Omit<Client, 'id'>) => Promise<Client | null>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  addWorkOrder: (wo: WorkOrder) => Promise<boolean>;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => Promise<boolean>;
  completeWorkOrder: (id: string, orderSnapshot?: WorkOrder) => Promise<void>;
  
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (id: number, updates: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: number) => Promise<void>;
  
  addService: (service: ServiceCatalogItem) => Promise<boolean>;
  updateService: (id: string, updates: Partial<ServiceCatalogItem>) => Promise<boolean>;
  deleteService: (id: string) => Promise<void>;
  updateServiceInterval: (id: string, days: number) => Promise<void>;
  
  updatePrice: (serviceId: string, size: VehicleSize, price: number) => Promise<void>;
  bulkUpdatePrices: (targetSize: VehicleSize | 'all', percentage: number) => Promise<void>;
  
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  addEmployeeTransaction: (trans: EmployeeTransaction) => Promise<void>;
  updateEmployeeTransaction: (id: string, updates: Partial<EmployeeTransaction>) => Promise<void>;
  deleteEmployeeTransaction: (id: string) => Promise<void>;

  addFinancialTransaction: (trans: FinancialTransaction) => Promise<void>;
  updateFinancialTransaction: (id: number, updates: Partial<FinancialTransaction>) => Promise<void>;
  deleteFinancialTransaction: (id: number) => Promise<void>;
  calculateFee: (amount: number, method: string) => { fee: number, netAmount: number };

  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  
  // Auth & Tenant
  loginOwner: (email: string, password: string) => Promise<AuthResponse>;
  registerOwner: (name: string, email: string, shopName: string, password: string) => Promise<AuthResponse>;
  logoutOwner: () => Promise<void>;
  updateOwner: (updates: { name?: string; email?: string; password?: string }) => Promise<boolean>;
  createTenant: (name: string, phone: string) => Promise<boolean>;
  reloadUserData: () => Promise<void>;

  // Features
  toggleTheme: () => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Integrations
  connectWhatsapp: () => Promise<void>;
  disconnectWhatsapp: () => Promise<void>;
  getWhatsappLink: (phone: string, message: string) => string;
  
  // Gamification
  getClientPoints: (clientId: string) => ClientPoints | undefined;
  addPointsToClient: (clientId: string, workOrderId: string, points: number, description: string) => void;
  getFidelityCard: (clientId: string) => FidelityCard | undefined;
  createFidelityCard: (clientId: string) => Promise<FidelityCard>;
  rewards: Reward[];
  addReward: (reward: Reward) => void;
  updateReward: (id: string, updates: Partial<Reward>) => void;
  deleteReward: (id: string) => void;
  getRewardsByLevel: (level: TierLevel) => Reward[];
  claimReward: (clientId: string, rewardId: string) => { success: boolean; message: string; voucherCode?: string };
  redemptions: Redemption[];
  getClientRedemptions: (clientId: string) => Redemption[];
  useVoucher: (code: string, workOrderId: string) => { success: boolean; message: string };
  getVoucherDetails: (code: string) => { redemption: Redemption, reward: Reward | undefined } | null;
  generatePKPass: (clientId: string) => string;
  generateGoogleWallet: (clientId: string) => string;
  seedDefaultRewards: (targetTenantId?: string) => Promise<void>;

  // Marketing
  createCampaign: (campaign: MarketingCampaign) => void;
  updateCampaign: (id: string, updates: Partial<MarketingCampaign>) => void;
  deleteCampaign: (id: string) => void;
  seedDefaultCampaigns: () => Promise<void>;
  
  // Subscription
  buyTokens: (amount: number, cost: number) => void;
  consumeTokens: (amount: number, description: string) => boolean;
  changePlan: (planId: 'starter' | 'pro' | 'enterprise' | 'trial') => void;
  cancelSubscription: () => Promise<void>;
  forceSyncToCloud: () => Promise<void>;

  // Service Consumption
  updateServiceConsumption: (consumption: ServiceConsumption) => Promise<boolean>;
  getServiceConsumption: (serviceId: string) => ServiceConsumption | undefined;
  calculateServiceCost: (serviceId: string) => number;

  // Vehicles
  addVehicle: (clientId: string, vehicle: Vehicle) => Promise<void>;
  updateVehicle: (clientId: string, vehicle: Vehicle) => Promise<void>;
  removeVehicle: (clientId: string, vehicleId: string) => Promise<void>;

  // NPS
  submitNPS: (workOrderId: string, score: number) => Promise<void>;
  updateClientLTV: (clientId: string, amount: number) => Promise<void>;

  // Social Studio
  createSocialPost: (post: SocialPost) => Promise<void>;
  generateSocialContent: (workOrder: WorkOrder) => Promise<{caption: string, hashtags: string[]}>;

  // Support
  createSupportTicket: (ticket: Partial<SupportTicket>) => Promise<boolean>;

  // Missing Functions Restoration
  checkPermission: (feature: string) => boolean;
  planLimits: { maxEmployees: number };
  checkLimit: (resource: 'employees', currentCount: number) => boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  currentUser: Employee | null;
  generateReminders: (os: WorkOrder) => void;
  startTask: (taskId: string) => void;
  stopTask: (taskId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [priceMatrix, setPriceMatrix] = useState<PriceMatrixEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeTransactions, setEmployeeTransactions] = useState<EmployeeTransaction[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(initialCompanySettings);
  const [subscription, setSubscription] = useState<SubscriptionDetails>({
    planId: 'trial',
    status: 'trial',
    nextBillingDate: addDays(new Date(), 14).toISOString(),
    paymentMethod: 'Credit Card',
    tokenBalance: 50,
    tokenHistory: [],
    invoices: []
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ownerUser, setOwnerUser] = useState<ShopOwner | null>(null);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  
  const [clientPoints, setClientPoints] = useState<ClientPoints[]>([]);
  const [fidelityCards, setFidelityCards] = useState<FidelityCard[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  // Polling ref for WhatsApp
  const waPollRef = useRef<NodeJS.Timeout | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    initApp();
    return () => {
        if (waPollRef.current) clearInterval(waPollRef.current);
    };
  }, []);

  const initApp = async () => {
    setIsAppLoading(true);
    try {
      await db.init();
      
      const storedUser = localStorage.getItem('cristal_care_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setOwnerUser(user);
        
        const tenants = await db.getAll<any>('tenants');
        const userTenant = tenants.find((t: any) => t.owner_id === user.id);
        
        if (userTenant) {
          setTenantId(userTenant.id);
          await loadTenantData(userTenant.id);
        }
      }
    } catch (error) {
      console.error("Failed to init app:", error);
    } finally {
      setIsAppLoading(false);
    }
  };

  const loadTenantData = async (tId: string) => {
    try {
      const [
        loadedClients, loadedInventory, loadedWorkOrders, loadedServices, 
        loadedEmployees, loadedEmpTrans, loadedFinTrans, loadedReminders,
        loadedCampaigns, loadedRewards, loadedRedemptions, loadedCards, 
        loadedPoints, loadedAlerts, loadedLogs, loadedTickets, loadedPosts
      ] = await Promise.all([
        db.getAll<Client>('clients'),
        db.getAll<InventoryItem>('inventory'),
        db.getAll<WorkOrder>('work_orders'),
        db.getAll<ServiceCatalogItem>('services'),
        db.getAll<Employee>('employees'),
        db.getAll<EmployeeTransaction>('employee_transactions'),
        db.getAll<FinancialTransaction>('financial_transactions'),
        db.getAll<Reminder>('reminders'),
        db.getAll<MarketingCampaign>('marketing_campaigns'),
        db.getAll<Reward>('rewards'),
        db.getAll<Redemption>('redemptions'),
        db.getAll<FidelityCard>('fidelity_cards'),
        db.getAll<ClientPoints>('points_history'),
        db.getAll<SystemAlert>('alerts'),
        db.getAll<MessageLog>('message_logs'),
        db.getAll<SupportTicket>('support_tickets'),
        db.getAll<SocialPost>('social_posts')
      ]);

      // SANITIZATION: Ensure arrays are initialized
      setClients(loadedClients.filter(i => i.tenant_id === tId).map(c => ({
          ...c,
          vehicles: c.vehicles || [] // Fix: Ensure vehicles is always an array
      })));
      setInventory(loadedInventory.filter(i => i.tenant_id === tId));
      setWorkOrders(loadedWorkOrders.filter(i => i.tenant_id === tId));
      setEmployees(loadedEmployees.filter(i => i.tenant_id === tId));
      setEmployeeTransactions(loadedEmpTrans.filter(i => i.tenant_id === tId));
      setFinancialTransactions(loadedFinTrans.filter(i => i.tenant_id === tId));
      setReminders(loadedReminders.filter(i => i.tenant_id === tId));
      setCampaigns(loadedCampaigns.filter(i => i.tenant_id === tId));
      setRewards(loadedRewards.filter(i => i.tenant_id === tId));
      setRedemptions(loadedRedemptions.filter(i => i.tenant_id === tId));
      setFidelityCards(loadedCards.filter(i => i.tenant_id === tId));
      setClientPoints(loadedPoints.filter(i => i.tenant_id === tId));
      setSystemAlerts(loadedAlerts.filter(i => i.tenant_id === tId));
      setMessageLogs(loadedLogs.filter(i => i.tenant_id === tId));
      setSupportTickets(loadedTickets.filter(i => i.tenant_id === tId));
      setSocialPosts(loadedPosts.filter(i => i.tenant_id === tId));

      const tenantServices = loadedServices.filter(i => i.tenant_id === tId);
      setServices(tenantServices);
      
      const matrix: PriceMatrixEntry[] = [];
      tenantServices.forEach(s => {
          if (s.price_matrix && s.price_matrix.prices) {
              Object.entries(s.price_matrix.prices).forEach(([size, price]) => {
                  matrix.push({ serviceId: s.id, size: size as VehicleSize, price: Number(price) });
              });
          }
      });
      setPriceMatrix(matrix);

      const tenant = await db.getById<any>('tenants', tId);
      if (tenant) {
          if (tenant.settings) setCompanySettings({ ...initialCompanySettings, ...tenant.settings });
          if (tenant.subscription) setSubscription(tenant.subscription);
      }

    } catch (e) {
      console.error("Error loading tenant data", e);
    }
  };

  // ... (Auth actions remain the same) ...
  const loginOwner = async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
          return { success: false, error: { message: error.message } };
      }

      if (data.user) {
          const { data: tenants } = await supabase.from('tenants').select('*').eq('owner_id', data.user.id);
          let shopName = 'Minha Loja';
          if (tenants && tenants.length > 0) {
              const tenant = tenants[0];
              shopName = tenant.name;
              setTenantId(tenant.id);
              const localTenant = await db.getById('tenants', tenant.id);
              if (!localTenant) {
                  await db.create('tenants', tenant);
              }
              await loadTenantData(tenant.id);
          }
          const userObj: ShopOwner = {
              id: data.user.id,
              name: data.user.user_metadata.name || email.split('@')[0],
              email: email,
              shopName: shopName
          };
          setOwnerUser(userObj);
          localStorage.setItem('cristal_care_user', JSON.stringify(userObj));
          return { success: true };
      }
      return { success: false, error: { message: 'Erro desconhecido no login' } };
  };

  const registerOwner = async (name: string, email: string, shopName: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, shopName } }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
  };

  const logoutOwner = async () => {
      try {
          await supabase.auth.signOut();
      } catch (error) {
          console.error("Error signing out:", error);
      } finally {
          setOwnerUser(null);
          setTenantId(null);
          localStorage.removeItem('cristal_care_user');
          window.location.href = '/login';
      }
  };

  const updateOwner = async (updates: { name?: string; email?: string; password?: string }) => {
      if (updates.password) {
          const { error } = await supabase.auth.updateUser({ password: updates.password });
          if (error) return false;
      }
      return true;
  };

  const createTenant = async (name: string, phone: string) => {
      if (!ownerUser) return false;
      const newTenant = {
          id: generateUUID(),
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          owner_id: ownerUser.id,
          plan_id: 'trial',
          status: 'active',
          settings: { ...initialCompanySettings, name, phone },
          subscription: { ...subscription, status: 'trial' },
          created_at: new Date().toISOString()
      };
      await db.create('tenants', newTenant);
      await supabase.from('tenants').insert(newTenant);
      setTenantId(newTenant.id);
      setCompanySettings(newTenant.settings);
      await seedDefaultCampaigns();
      await seedDefaultRewards(newTenant.id);
      return true; 
  };

  const reloadUserData = async () => {
      if (tenantId) await loadTenantData(tenantId);
  };

  const updateCompanySettings = (settings: Partial<CompanySettings>) => {
    setCompanySettings(prev => {
        const newSettings = { ...prev, ...settings };
        if (tenantId) {
            (async () => {
                await db.update('tenants', tenantId, { settings: newSettings });
                if (isValidUUID(tenantId)) {
                    await supabase.from('tenants').update({ settings: newSettings as any }).eq('id', tenantId);
                }
            })();
        }
        return newSettings;
    });
  };

  const connectWhatsapp = async () => {
    const cleanSettings = { 
        ...companySettings.whatsapp, 
        session: { 
            status: 'scanning' as const, 
            qrCode: undefined, 
            pairingCode: undefined,
            device: undefined
        } 
    };
    setCompanySettings(prev => ({ ...prev, whatsapp: cleanSettings }));
    if (tenantId) {
        await db.update('tenants', tenantId, { settings: { ...companySettings, whatsapp: cleanSettings } });
    }
    try {
        const { data: saasSettings } = await supabase.from('saas_settings').select('whatsapp_global').single();
        const globalConfig = saasSettings?.whatsapp_global as any;
        if (!globalConfig || !globalConfig.enabled || !globalConfig.baseUrl || !globalConfig.apiKey) {
            throw new Error("Serviço de WhatsApp não configurado pelo administrador.");
        }
        const sessionName = tenantId || 'default';
        const { qrCode, pairingCode } = await whatsappService.startSession({ 
            baseUrl: globalConfig.baseUrl, 
            apiKey: globalConfig.apiKey,
            instanceId: globalConfig.instanceId,
            sessionName
        });
        setCompanySettings(current => {
            const updated = { 
                ...current, 
                whatsapp: { 
                    ...current.whatsapp, 
                    session: { 
                        ...current.whatsapp.session, 
                        status: 'scanning', 
                        qrCode, 
                        pairingCode 
                    } 
                } 
            };
            if (tenantId) {
                (async () => { await db.update('tenants', tenantId, { settings: updated }); })();
            }
            return updated;
        });
        if (waPollRef.current) clearInterval(waPollRef.current);
        let attempts = 0;
        waPollRef.current = setInterval(async () => {
            attempts++;
            if (attempts > 60) { 
                if (waPollRef.current) clearInterval(waPollRef.current);
                return;
            }
            const statusInfo = await whatsappService.checkStatus({ 
                baseUrl: globalConfig.baseUrl, 
                apiKey: globalConfig.apiKey,
                instanceId: globalConfig.instanceId,
                sessionName
            });
            if (statusInfo.status === 'connected') {
                if (waPollRef.current) clearInterval(waPollRef.current);
                updateCompanySettings({ 
                    whatsapp: { 
                        ...companySettings.whatsapp, 
                        session: { 
                            status: 'connected', 
                            device: statusInfo.device,
                            qrCode: undefined, 
                            pairingCode: undefined 
                        } 
                    } 
                });
            }
        }, 5000);
    } catch (e: any) { 
        console.error("Erro ao conectar WhatsApp:", e); 
        alert(`Erro ao conectar: ${e.message}`);
        updateCompanySettings({ whatsapp: { ...companySettings.whatsapp, session: { status: 'disconnected' } } });
    }
  };

  const disconnectWhatsapp = async () => {
      try {
        const { data: saasSettings } = await supabase.from('saas_settings').select('whatsapp_global').single();
        const globalConfig = saasSettings?.whatsapp_global as any;
        const sessionName = tenantId || 'default';
        if (globalConfig) {
            await whatsappService.logout({ 
                baseUrl: globalConfig.baseUrl, 
                apiKey: globalConfig.apiKey,
                instanceId: globalConfig.instanceId,
                sessionName
            });
        }
      } catch (e) {
          console.error("Erro ao desconectar remotamente", e);
      }
      if (waPollRef.current) clearInterval(waPollRef.current);
      updateCompanySettings({ 
          whatsapp: { 
              ...companySettings.whatsapp, 
              session: { status: 'disconnected', qrCode: undefined, pairingCode: undefined, device: undefined } 
          } 
      });
  };

  // ... (CRUD functions)
  const addClient = async (client: Omit<Client, 'id'>) => {
    if (!tenantId) return null;
    const newClient = { ...client, tenant_id: tenantId, vehicles: client.vehicles || [] };
    const created = await db.create<Client>('clients', newClient as Client);
    setClients(prev => [...prev, created]);
    return created;
  };
  const updateClient = async (id: string, updates: Partial<Client>) => {
    await db.update('clients', id, updates);
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  const deleteClient = async (id: string) => {
    await db.delete('clients', id);
    setClients(prev => prev.filter(c => c.id !== id));
  };
  const addVehicle = async (clientId: string, vehicle: Vehicle) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const updatedVehicles = [...(client.vehicles || []), vehicle];
    await updateClient(clientId, { vehicles: updatedVehicles });
  };
  const updateVehicle = async (clientId: string, vehicle: Vehicle) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const updatedVehicles = (client.vehicles || []).map(v => v.id === vehicle.id ? vehicle : v);
    await updateClient(clientId, { vehicles: updatedVehicles });
  };
  const removeVehicle = async (clientId: string, vehicleId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const updatedVehicles = (client.vehicles || []).filter(v => v.id !== vehicleId);
    await updateClient(clientId, { vehicles: updatedVehicles });
  };
  const addWorkOrder = async (wo: WorkOrder) => {
    if (!tenantId) return false;
    const newWO = { ...wo, tenant_id: tenantId };
    const created = await db.create<WorkOrder>('work_orders', newWO);
    setWorkOrders(prev => [...prev, created]);
    return true;
  };
  const updateWorkOrder = async (id: string, updates: Partial<WorkOrder>) => {
    await db.update('work_orders', id, updates);
    setWorkOrders(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    return true;
  };
  const completeWorkOrder = async (id: string, orderSnapshot?: WorkOrder) => {
      const updates: any = { status: 'Concluído', completedAt: new Date().toISOString() };
      if (orderSnapshot) Object.assign(updates, orderSnapshot);
      await updateWorkOrder(id, updates);
  };
  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    if (!tenantId) return;
    const newItem = { ...item, tenant_id: tenantId };
    const created = await db.create<InventoryItem>('inventory', newItem as InventoryItem);
    setInventory(prev => [...prev, created]);
  };
  const updateInventoryItem = async (id: number, updates: Partial<InventoryItem>) => {
    await db.update('inventory', id, updates);
    setInventory(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };
  const deleteInventoryItem = async (id: number) => {
    await db.delete('inventory', id);
    setInventory(prev => prev.filter(i => i.id !== id));
  };
  const addService = async (service: ServiceCatalogItem) => {
    if (!tenantId) return false;
    const newService = { ...service, tenant_id: tenantId };
    const created = await db.create<ServiceCatalogItem>('services', newService);
    setServices(prev => [...prev, created]);
    return true;
  };
  const updateService = async (id: string, updates: Partial<ServiceCatalogItem>) => {
    await db.update('services', id, updates);
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    return true;
  };
  const deleteService = async (id: string) => {
    await db.delete('services', id);
    setServices(prev => prev.filter(s => s.id !== id));
  };
  const updateServiceInterval = async (id: string, days: number) => {
    await updateService(id, { returnIntervalDays: days });
  };
  const updatePrice = async (serviceId: string, size: VehicleSize, price: number) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    const currentMatrix = service.price_matrix || { prices: {} };
    const newPrices = { ...currentMatrix.prices, [size]: price };
    const newMatrix = { ...currentMatrix, prices: newPrices };
    await updateService(serviceId, { price_matrix: newMatrix });
    setPriceMatrix(prev => {
        const filtered = prev.filter(p => !(p.serviceId === serviceId && p.size === size));
        return [...filtered, { serviceId, size, price }];
    });
  };
  const bulkUpdatePrices = async (targetSize: VehicleSize | 'all', percentage: number) => {
    const factor = 1 + (percentage / 100);
    for (const service of services) {
        if (!service.price_matrix?.prices) continue;
        const newPrices = { ...service.price_matrix.prices };
        let changed = false;
        Object.keys(newPrices).forEach(key => {
            if (targetSize === 'all' || key === targetSize) {
                newPrices[key as VehicleSize] = Math.ceil(Number(newPrices[key as VehicleSize]) * factor);
                changed = true;
            }
        });
        if (changed) {
            await updateService(service.id, { price_matrix: { ...service.price_matrix, prices: newPrices } });
            setPriceMatrix(prev => {
                const updated = prev.map(p => {
                    if (p.serviceId === service.id && (targetSize === 'all' || p.size === targetSize)) {
                        return { ...p, price: Math.ceil(p.price * factor) };
                    }
                    return p;
                });
                return updated;
            });
        }
    }
  };
  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    if (!tenantId) return;
    const newEmp = { ...employee, tenant_id: tenantId };
    const created = await db.create<Employee>('employees', newEmp as Employee);
    setEmployees(prev => [...prev, created]);
  };
  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    await db.update('employees', id, updates);
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };
  const deleteEmployee = async (id: string) => {
    await db.delete('employees', id);
    setEmployees(prev => prev.filter(e => e.id !== id));
  };
  const addEmployeeTransaction = async (trans: EmployeeTransaction) => {
    if (!tenantId) return;
    const newTrans = { ...trans, tenant_id: tenantId };
    const created = await db.create<EmployeeTransaction>('employee_transactions', newTrans);
    setEmployeeTransactions(prev => [...prev, created]);
    const emp = employees.find(e => e.id === trans.employeeId);
    if (emp) {
        let balanceChange = 0;
        if (trans.type === 'commission' || trans.type === 'salary') balanceChange = trans.amount;
        if (trans.type === 'advance' || trans.type === 'payment') balanceChange = -trans.amount;
        await updateEmployee(emp.id, { balance: emp.balance + balanceChange });
    }
  };
  const updateEmployeeTransaction = async (id: string, updates: Partial<EmployeeTransaction>) => {
    await db.update('employee_transactions', id, updates);
    setEmployeeTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };
  const deleteEmployeeTransaction = async (id: string) => {
    await db.delete('employee_transactions', id);
    setEmployeeTransactions(prev => prev.filter(t => t.id !== id));
  };
  const addFinancialTransaction = async (trans: FinancialTransaction) => {
    if (!tenantId) return;
    const newTrans = { ...trans, tenant_id: tenantId };
    const created = await db.create<FinancialTransaction>('financial_transactions', newTrans);
    setFinancialTransactions(prev => [...prev, created]);
  };
  const updateFinancialTransaction = async (id: number, updates: Partial<FinancialTransaction>) => {
    await db.update('financial_transactions', id, updates);
    setFinancialTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };
  const deleteFinancialTransaction = async (id: number) => {
    await db.delete('financial_transactions', id);
    setFinancialTransactions(prev => prev.filter(t => t.id !== id));
  };
  const calculateFee = (amount: number, method: string) => {
    const rate = companySettings.paymentRates.find(r => r.method === method)?.rate || 0;
    const fee = amount * (rate / 100);
    return { fee, netAmount: amount - fee };
  };
  const createCampaign = async (campaign: MarketingCampaign) => {
    if (!tenantId) return;
    const newCamp = { ...campaign, tenant_id: tenantId };
    const created = await db.create<MarketingCampaign>('marketing_campaigns', newCamp);
    setCampaigns(prev => [...prev, created]);
  };
  const updateCampaign = async (id: string, updates: Partial<MarketingCampaign>) => {
    await db.update('marketing_campaigns', id, updates);
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  const deleteCampaign = async (id: string) => {
    await db.delete('marketing_campaigns', id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };
  const seedDefaultCampaigns = async () => {
    if (!tenantId) return;
    for (const template of CAMPAIGN_TEMPLATES) {
        await createCampaign({
            id: `cmp-def-${Date.now()}-${template.id}`,
            name: template.label.split('(')[0].trim(),
            type: template.id as any,
            targetSegment: template.suggestedSegment,
            selectedClientIds: [],
            messageTemplate: template.defaultMessage,
            channel: 'whatsapp',
            status: 'draft',
            sentCount: 0,
            costInTokens: 0,
            tenant_id: tenantId
        });
    }
  };
  const submitNPS = async (workOrderId: string, score: number) => { 
      await updateWorkOrder(workOrderId, { npsScore: score });
  };
  const updateClientLTV = async (clientId: string, amount: number) => { 
      const client = clients.find(c => c.id === clientId);
      if (client) {
          await updateClient(clientId, { 
              ltv: (client.ltv || 0) + amount,
              visitCount: (client.visitCount || 0) + 1,
              lastVisit: new Date().toISOString()
          });
      }
  };
  const createSocialPost = async (post: SocialPost) => { 
      if (!tenantId) return;
      const created = await db.create<SocialPost>('social_posts', { ...post, tenant_id: tenantId });
      setSocialPosts(prev => [...prev, created]);
  };
  const generateSocialContent = async (workOrder: WorkOrder) => {
      return { 
          caption: `Olha esse resultado incrível no ${workOrder.vehicle}! ✨ Serviço de ${workOrder.service} finalizado com sucesso. #esteticaautomotiva #detailing`, 
          hashtags: ['#carro', '#brilho', '#protecao'] 
      };
  };
  const createSupportTicket = async (ticket: Partial<SupportTicket>) => {
      if (!tenantId) return false;
      const newTicket = { 
          ...ticket, 
          tenant_id: tenantId, 
          status: 'open', 
          created_at: new Date().toISOString(),
          user_id: ownerUser?.id,
          user_name: ownerUser?.name
      };
      const created = await db.create<SupportTicket>('support_tickets', newTicket as SupportTicket);
      setSupportTickets(prev => [...prev, created]);
      return true;
  };
  const buyTokens = (amount: number, cost: number) => {
      setSubscription(prev => ({ ...prev, tokenBalance: (prev.tokenBalance || 0) + amount }));
  };
  const consumeTokens = (amount: number, description: string) => {
      if ((subscription.tokenBalance || 0) >= amount) {
          setSubscription(prev => ({ ...prev, tokenBalance: prev.tokenBalance - amount }));
          return true;
      }
      return false;
  };
  const changePlan = (planId: any) => {
      setSubscription(prev => ({ ...prev, planId }));
  };
  const cancelSubscription = async () => {
      setSubscription(prev => ({ ...prev, status: 'inactive' }));
  };
  const forceSyncToCloud = async () => { };
  const updateServiceConsumption = async (consumption: ServiceConsumption) => {
      const service = services.find(s => s.id === consumption.serviceId);
      if (service) {
          const newMatrix = { ...service.price_matrix, consumption: consumption.items };
          await updateService(service.id, { price_matrix: newMatrix });
          return true;
      }
      return false;
  };
  const getServiceConsumption = (serviceId: string) => {
      const service = services.find(s => s.id === serviceId);
      return service?.price_matrix?.consumption ? { serviceId, items: service.price_matrix.consumption } : undefined;
  };
  const calculateServiceCost = (serviceId: string) => {
      const consumption = getServiceConsumption(serviceId);
      if (!consumption) return 0;
      return consumption.items.reduce((total, item) => {
          const invItem = inventory.find(i => i.id === item.inventoryId);
          if (!invItem) return total;
          let multiplier = 1;
          return total + (invItem.costPrice * item.quantity * multiplier);
      }, 0);
  };
  const checkPermission = (feature: string) => {
      if (ownerUser) return true;
      if (!currentUser) return false;
      return currentUser.role === 'admin' || currentUser.role === 'manager';
  };
  const planLimits = { maxEmployees: subscription.planId === 'pro' ? 10 : 5 };
  const checkLimit = (resource: 'employees', currentCount: number) => {
      if (resource === 'employees') return currentCount < planLimits.maxEmployees;
      return true;
  };
  const login = (pin: string) => {
      const emp = employees.find(e => e.pin === pin && e.active);
      if (emp) {
          setCurrentUser(emp);
          return true;
      }
      return false;
  };
  const logout = () => setCurrentUser(null);
  const generateReminders = (os: WorkOrder) => {
      if (os.serviceId) {
          const service = services.find(s => s.id === os.serviceId);
          if (service && service.returnIntervalDays && service.returnIntervalDays > 0) {
              const dueDate = addDays(new Date(), service.returnIntervalDays).toISOString();
              const reminder: Reminder = {
                  id: `rem-${Date.now()}`,
                  clientId: os.clientId,
                  vehicleId: '', 
                  serviceType: `Retorno: ${service.name}`,
                  dueDate,
                  status: 'pending',
                  createdAt: new Date().toISOString(),
                  autoGenerated: true,
                  tenant_id: tenantId || undefined
              };
          }
      }
  };
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const clearAllNotifications = () => {
    setNotifications([]);
  };
  const getWhatsappLink = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
  };
  const getClientPoints = (clientId: string) => {
      return clientPoints.find(cp => cp.clientId === clientId);
  };
  const addPointsToClient = (clientId: string, workOrderId: string, points: number, description: string) => {
      // Implementation needed
  };
  const getFidelityCard = (clientId: string) => fidelityCards.find(c => c.clientId === clientId);
  const createFidelityCard = async (clientId: string) => {
      const newCard: FidelityCard = {
          clientId,
          cardNumber: Math.random().toString().slice(2, 10),
          cardHolder: clients.find(c => c.id === clientId)?.name || 'Cliente',
          cardColor: 'blue',
          qrCode: '',
          expiresAt: addDays(new Date(), 365).toISOString(),
          issueDate: new Date().toISOString()
      };
      setFidelityCards(prev => [...prev, newCard]);
      return newCard;
  };
  const addReward = (reward: Reward) => {
      if (!tenantId) return;
      const newReward = { ...reward, tenant_id: tenantId, id: generateUUID() };
      db.create('rewards', newReward).then(r => setRewards(prev => [...prev, r]));
  };
  const updateReward = (id: string, updates: Partial<Reward>) => {
      db.update('rewards', id, updates).then(() => {
          setRewards(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      });
  };
  const deleteReward = (id: string) => {
      db.delete('rewards', id).then(() => {
          setRewards(prev => prev.filter(r => r.id !== id));
      });
  };
  const getRewardsByLevel = (level: TierLevel) => {
      if (!rewards) return [];
      return rewards.filter(r => r.requiredLevel === level);
  };
  const claimReward = (clientId: string, rewardId: string) => {
      return { success: true, message: 'Recompensa resgatada', voucherCode: 'VOUCHER123' };
  };
  const getClientRedemptions = (clientId: string) => redemptions.filter(r => r.clientId === clientId);
  const useVoucher = (code: string, workOrderId: string) => {
      return { success: true, message: 'Voucher aplicado' };
  };
  const getVoucherDetails = (code: string) => {
      const redemption = redemptions.find(r => r.code === code);
      if (!redemption) return null;
      const reward = rewards.find(r => r.id === redemption.rewardId);
      return { redemption, reward };
  };
  const generatePKPass = (clientId: string) => '';
  const generateGoogleWallet = (clientId: string) => '';
  
  // --- FIXED SEED DEFAULT REWARDS ---
  const seedDefaultRewards = async (targetTenantId?: string) => {
      const tId = targetTenantId || tenantId;
      if (!tId) return;

      const newRewards: Reward[] = [];

      for (const mock of MOCK_REWARDS) {
          const { id, ...rest } = mock; // Remove mock ID
          const reward: Reward = {
              ...rest,
              id: generateUUID(),
              tenant_id: tId,
              createdAt: new Date().toISOString(),
              active: true
          } as Reward;

          await db.create('rewards', reward);
          await supabase.from('rewards').insert(reward);
          newRewards.push(reward);
      }

      // If we are currently in the context of the target tenant (or no target specified), update state
      if (!targetTenantId || targetTenantId === tenantId) {
          setRewards(prev => [...prev, ...newRewards]);
      }
  };

  const startTask = (taskId: string) => {};
  const stopTask = (taskId: string) => {};

  return (
    <AppContext.Provider value={{
      clients, inventory, workOrders, services, priceMatrix, employees,
      employeeTransactions, financialTransactions, reminders, campaigns,
      companySettings, subscription, notifications, ownerUser, systemAlerts,
      clientPoints,
      socialPosts, messageLogs, theme, isAppLoading, tenantId, supportTickets,
      
      addClient, updateClient, deleteClient,
      addWorkOrder, updateWorkOrder, completeWorkOrder,
      addInventoryItem, updateInventoryItem, deleteInventoryItem,
      addService, updateService, deleteService, updateServiceInterval,
      updatePrice, bulkUpdatePrices,
      addEmployee, updateEmployee, deleteEmployee,
      addEmployeeTransaction, updateEmployeeTransaction, deleteEmployeeTransaction,
      addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction, calculateFee,
      
      updateCompanySettings, loginOwner, registerOwner, logoutOwner, updateOwner, createTenant, reloadUserData,
      toggleTheme, markNotificationAsRead, clearAllNotifications,
      connectWhatsapp, disconnectWhatsapp, getWhatsappLink,
      
      getClientPoints, addPointsToClient, getFidelityCard, createFidelityCard, rewards, addReward, updateReward, deleteReward, getRewardsByLevel, claimReward, redemptions, getClientRedemptions, useVoucher, getVoucherDetails, generatePKPass, generateGoogleWallet, seedDefaultRewards,
      
      createCampaign, updateCampaign, deleteCampaign, seedDefaultCampaigns,
      buyTokens, consumeTokens, changePlan, cancelSubscription, forceSyncToCloud,
      
      updateServiceConsumption, getServiceConsumption, calculateServiceCost,
      addVehicle, updateVehicle, removeVehicle,
      submitNPS, updateClientLTV,
      createSocialPost, generateSocialContent,
      createSupportTicket,
      
      checkPermission, planLimits, checkLimit, login, logout, currentUser, generateReminders,
      startTask, stopTask
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
