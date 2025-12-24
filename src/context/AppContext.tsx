import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { 
  Client, InventoryItem, WorkOrder, ServiceRecipe, Reminder, Vehicle, 
  ServiceCatalogItem, PriceMatrixEntry, VehicleSize, Employee, Task, 
  EmployeeTransaction, MarketingCampaign,
  CompanySettings, SubscriptionDetails, FinancialTransaction, ClientPoints, FidelityCard, Reward,
  Redemption, TierConfig, TierLevel, ShopOwner, Notification, ServiceConsumption, AuthResponse,
  SystemAlert, SocialPost, CustomAutomation, MessageLog, VEHICLE_SIZES
} from '../types';
import { addDays, formatISO, isAfter } from 'date-fns';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { isValidUUID, generateUUID, formatId } from '../lib/utils';
import { MOCK_ALERTS, MOCK_REWARDS } from '../lib/mockData';
import { CAMPAIGN_TEMPLATES } from '../services/campaignService';
import { DEFAULT_TERMS, DEFAULT_PRIVACY } from '../lib/legalDefaults';

const defaultTiers: TierConfig[] = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, color: 'from-amber-500 to-amber-600', benefits: ['5% de desconto'] },
  { id: 'silver', name: 'Prata', minPoints: 1000, color: 'from-slate-400 to-slate-600', benefits: ['10% de desconto', 'Frete grátis'] },
  { id: 'gold', name: 'Ouro', minPoints: 3000, color: 'from-yellow-500 to-yellow-600', benefits: ['15% de desconto', 'Atendimento prioritário'] },
  { id: 'platinum', name: 'Platina', minPoints: 5000, color: 'from-blue-500 to-blue-600', benefits: ['20% de desconto', 'Brinde exclusivo'] }
];

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
  hourlyRate: 50,
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
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'status'>) => Promise<void>;
  updateInventoryItem: (id: number, updates: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: number) => Promise<void>;
  deductStock: (serviceId: string) => void;
  toggleTheme: () => void;
  generateReminders: (os: WorkOrder) => void;
  addService: (service: Partial<ServiceCatalogItem>) => Promise<boolean>;
  updateService: (id: string, updates: Partial<ServiceCatalogItem>) => Promise<boolean>;
  deleteService: (id: string) => Promise<boolean>; 
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

  const priceMatrixRef = useRef(priceMatrix);
  const servicesRef = useRef(services);

  useEffect(() => { priceMatrixRef.current = priceMatrix; }, [priceMatrix]);
  useEffect(() => { servicesRef.current = services; }, [services]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // --- HELPER: AGGREGATE POINTS ---
  const aggregatePoints = useCallback((history: any[]) => {
      const pointsMap: Record<string, ClientPoints> = {};
      history.forEach(entry => {
          const cId = entry.client_id || entry.clientId;
          if (!cId) return;
          if (!pointsMap[cId]) {
              pointsMap[cId] = {
                  clientId: cId,
                  totalPoints: 0,
                  currentLevel: 1,
                  tier: 'bronze',
                  lastServiceDate: new Date().toISOString(),
                  servicesCompleted: 0,
                  pointsHistory: []
              };
          }
          const cp = pointsMap[cId];
          cp.totalPoints += entry.points;
          
          cp.pointsHistory.push({
              id: entry.id,
              workOrderId: entry.work_order_id || entry.workOrderId,
              points: entry.points,
              description: entry.description,
              date: entry.created_at || entry.date
          });
          if (entry.type === 'earn') cp.servicesCompleted += 1;
      });
      
      const tiers = companySettings.gamification?.tiers || defaultTiers;
      return Object.values(pointsMap).map(cp => {
          let newTier: TierLevel = 'bronze';
          const pointsForTier = Math.max(0, cp.totalPoints);
          
          for (const t of tiers) {
              if (pointsForTier >= t.minPoints) newTier = t.id;
          }
          return { ...cp, totalPoints: pointsForTier, tier: newTier };
      });
  }, [companySettings.gamification?.tiers]);

  // Automatic Recalculation Effect
  useEffect(() => {
      if (pointsHistory.length > 0) {
          const aggregated = aggregatePoints(pointsHistory);
          setClientPoints(aggregated);
      }
  }, [pointsHistory, aggregatePoints]);

  const loadTenantData = useCallback(async (tenantData: any) => {
    try {
        setTenantId(tenantData.id);
        setCompanySettings({ ...initialCompanySettings, ...tenantData.settings });
        if (tenantData.subscription) setSubscription(tenantData.subscription);

        // SYNC POINTS HISTORY FROM SUPABASE (Using Upsert)
        if (isValidUUID(tenantData.id)) {
            try {
                const { data: remoteHistory } = await supabase.from('points_history').select('*').eq('tenant_id', tenantData.id);
                if (remoteHistory) {
                    for (const h of remoteHistory) { await db.upsert('points_history', h); }
                }
            } catch (err) { console.error("Failed to load points history", err); }
        }

        const [
          clientsData, vehiclesData, workOrdersData, inventoryData, servicesData, employeesData,
          financialData, campaignsData, rewardsData, redemptionsData, historyData, cardsData,
          alertsData, remindersData, empTransData
        ] = await Promise.all([
          db.getAll<Client>('clients'), db.getAll<Vehicle>('vehicles'), db.getAll<WorkOrder>('work_orders'),
          db.getAll<InventoryItem>('inventory'), db.getAll<ServiceCatalogItem>('services'), db.getAll<Employee>('employees'),
          db.getAll<FinancialTransaction>('financial_transactions'), db.getAll<MarketingCampaign>('marketing_campaigns'),
          db.getAll<Reward>('rewards'), db.getAll<Redemption>('redemptions'), db.getAll<any>('points_history'),
          db.getAll<FidelityCard>('fidelity_cards'), db.getAll<SystemAlert>('alerts'), db.getAll<Reminder>('reminders'),
          db.getAll<EmployeeTransaction>('employee_transactions')
        ]);

        const enrichedClients = clientsData.map(c => {
            const clientVehicles = vehiclesData.filter(v => v.client_id === c.id);
            const clientOrders = workOrdersData.filter(os => os.clientId === c.id && (os.status === 'Concluído' || os.status === 'Entregue'));
            const visitCount = clientOrders.length;
            const ltv = clientOrders.reduce((acc, os) => acc + (os.totalValue || 0), 0);
            let lastVisit = c.last_visit || c.lastVisit;
            if (clientOrders.length > 0) {
                const dates = clientOrders.map(os => new Date(os.createdAt || os.paidAt || '').getTime()).filter(d => !isNaN(d));
                if (dates.length > 0) {
                    const maxDate = new Date(Math.max(...dates));
                    lastVisit = maxDate.toISOString();
                }
            }
            return {
                ...c,
                vehicles: clientVehicles,
                visitCount: visitCount,
                ltv: ltv,
                lastVisit: lastVisit,
                status: (visitCount > 0 && lastVisit) ? (isAfter(new Date(), addDays(new Date(lastVisit), 60)) ? 'churn_risk' : 'active') : c.status
            };
        });

        setClients(enrichedClients);
        setWorkOrders(workOrdersData);
        setInventory(inventoryData);
        setEmployees(employeesData);
        setFinancialTransactions(financialData);
        setCampaigns(campaignsData);
        setRewards(rewardsData);
        setRedemptions(redemptionsData);
        setFidelityCards(cardsData);
        setSystemAlerts(alertsData.length > 0 ? alertsData : MOCK_ALERTS);
        setReminders(remindersData);
        setEmployeeTransactions(empTransData);

        const processedServices: ServiceCatalogItem[] = [];
        const processedMatrix: PriceMatrixEntry[] = [];
        const processedConsumptions: ServiceConsumption[] = [];

        servicesData.forEach(s => {
            processedServices.push(s);
            if (s.price_matrix) {
                if (s.price_matrix.prices) {
                    Object.entries(s.price_matrix.prices).forEach(([size, price]) => {
                        processedMatrix.push({ serviceId: s.id, size: size as VehicleSize, price });
                    });
                }
                if (s.price_matrix.consumption) {
                    processedConsumptions.push({ serviceId: s.id, items: s.price_matrix.consumption });
                }
            }
        });

        setServices(processedServices);
        setPriceMatrix(processedMatrix);
        setServiceConsumptions(processedConsumptions);
        setPointsHistory(historyData);
        // setClientPoints is handled by useEffect

    } catch (error) {
        console.error("Error loading tenant data:", error);
    } finally {
        setIsAppLoading(false);
    }
  }, [companySettings]);

  useEffect(() => {
    const init = async () => {
        await db.init();
        const storedUser = localStorage.getItem('cristal_care_user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setOwnerUser(user);
            const tenants = await db.getAll<any>('tenants');
            const tenant = tenants.find(t => t.owner_id === user.id);
            if (tenant) await loadTenantData(tenant);
            else setIsAppLoading(false);
        } else {
            setIsAppLoading(false);
        }
    };
    init();
  }, [loadTenantData]);

  // ... (CRUD functions remain same) ...
  const addClient = async (clientData: Partial<Client>) => {
    try {
      const newClient = {
        ...clientData,
        id: clientData.id || generateUUID(),
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        vehicles: []
      } as Client;

      setClients(prev => [...prev, newClient]);
      await db.create('clients', newClient);

      if (tenantId && isValidUUID(tenantId)) {
        await supabase.from('clients').insert({
          id: newClient.id,
          tenant_id: tenantId,
          name: newClient.name,
          phone: newClient.phone,
          email: newClient.email,
          address_data: {
             street: newClient.street,
             number: newClient.number,
             neighborhood: newClient.neighborhood,
             city: newClient.city,
             state: newClient.state,
             cep: newClient.cep,
             address: newClient.address
          },
          ltv: newClient.ltv || 0,
          visit_count: newClient.visitCount || 0,
          last_visit: newClient.lastVisit,
          status: newClient.status || 'active',
          segment: newClient.segment || 'new',
          notes: newClient.notes,
          created_at: newClient.created_at
        });
      }
      return newClient;
    } catch (error) {
      console.error("Error adding client:", error);
      return null;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      await db.update('clients', id, updates);

      if (tenantId && isValidUUID(tenantId)) {
        const payload: any = {};
        if (updates.name) payload.name = updates.name;
        if (updates.phone) payload.phone = updates.phone;
        if (updates.email !== undefined) payload.email = updates.email;
        if (updates.ltv !== undefined) payload.ltv = updates.ltv;
        if (updates.visitCount !== undefined) payload.visit_count = updates.visitCount;
        if (updates.lastVisit !== undefined) payload.last_visit = updates.lastVisit;
        if (updates.status) payload.status = updates.status;
        if (updates.segment) payload.segment = updates.segment;
        if (updates.notes !== undefined) payload.notes = updates.notes;
        
        if (updates.street || updates.number || updates.city || updates.address) {
             payload.address_data = {
                 street: updates.street,
                 number: updates.number,
                 neighborhood: updates.neighborhood,
                 city: updates.city,
                 state: updates.state,
                 cep: updates.cep,
                 address: updates.address
             };
        }

        await supabase.from('clients').update(payload).eq('id', id);
      }
    } catch (error) {
      console.error("Error updating client:", error);
    }
  };

  const deleteClient = async (id: string) => {
      try {
          setClients(prev => prev.filter(c => c.id !== id));
          await db.delete('clients', id);
          if (tenantId && isValidUUID(tenantId)) {
              await supabase.from('clients').delete().eq('id', id);
          }
      } catch (error) {
          console.error("Error deleting client:", error);
      }
  };

  const addVehicle = async (clientId: string, vehicle: Partial<Vehicle>) => {
    try {
        const newVehicle = {
            ...vehicle,
            id: vehicle.id || generateUUID(),
            client_id: clientId,
            tenant_id: tenantId,
            created_at: new Date().toISOString()
        } as Vehicle;

        setClients(prev => prev.map(c => {
            if (c.id === clientId) {
                return { ...c, vehicles: [...c.vehicles, newVehicle] };
            }
            return c;
        }));

        await db.create('vehicles', newVehicle);

        if (tenantId && isValidUUID(tenantId)) {
            await supabase.from('vehicles').insert({
                id: newVehicle.id,
                tenant_id: tenantId,
                client_id: clientId,
                model: newVehicle.model,
                plate: newVehicle.plate,
                color: newVehicle.color,
                year: newVehicle.year,
                size: newVehicle.size,
                created_at: newVehicle.created_at
            });
        }
    } catch (error) {
        console.error("Error adding vehicle:", error);
    }
  };

  const updateVehicle = async (clientId: string, vehicle: Vehicle) => {
    try {
        setClients(prev => prev.map(c => {
            if (c.id === clientId) {
                return {
                    ...c,
                    vehicles: c.vehicles.map(v => v.id === vehicle.id ? vehicle : v)
                };
            }
            return c;
        }));

        await db.update('vehicles', vehicle.id, vehicle);

        if (tenantId && isValidUUID(tenantId)) {
            await supabase.from('vehicles').update({
                model: vehicle.model,
                plate: vehicle.plate,
                color: vehicle.color,
                year: vehicle.year,
                size: vehicle.size
            }).eq('id', vehicle.id);
        }
    } catch (error) {
        console.error("Error updating vehicle:", error);
    }
  };

  const removeVehicle = async (clientId: string, vehicleId: string) => {
    try {
        setClients(prev => prev.map(c => {
            if (c.id === clientId) {
                return {
                    ...c,
                    vehicles: c.vehicles.filter(v => v.id !== vehicleId)
                };
            }
            return c;
        }));

        await db.delete('vehicles', vehicleId);

        if (tenantId && isValidUUID(tenantId)) {
            await supabase.from('vehicles').delete().eq('id', vehicleId);
        }
    } catch (error) {
        console.error("Error removing vehicle:", error);
    }
  };

  const updateCompanySettings = (settings: Partial<CompanySettings>) => {
    setCompanySettings(prev => {
        const newSettings = { ...prev, ...settings };
        (async () => {
            if (tenantId) {
                try {
                    const tenant = await db.getById('tenants', tenantId);
                    if (tenant) {
                        // @ts-ignore
                        await db.update('tenants', tenantId, { settings: newSettings });
                    }
                    if (isValidUUID(tenantId)) {
                        await supabase.from('tenants').update({ settings: newSettings as any }).eq('id', tenantId);
                    }
                } catch (err) { console.error('Error persisting settings:', err); }
            }
        })();
        return newSettings;
    });
  };

  // --- FIDELITY LOGIC ---
  const addPointsToClient = async (clientId: string, workOrderId: string, points: number, description: string) => {
      const entry = {
          id: generateUUID(),
          tenant_id: tenantId,
          client_id: clientId,
          work_order_id: workOrderId,
          points: points,
          description: description,
          type: points > 0 ? 'earn' : 'redeem',
          created_at: new Date().toISOString()
      };

      // Update local history (useEffect handles clientPoints update)
      setPointsHistory(prev => [...prev, entry]);
      await db.create('points_history', entry);

      // Update Supabase
      if (tenantId && isValidUUID(tenantId)) {
          const { error } = await supabase.from('points_history').insert({
              id: entry.id,
              tenant_id: tenantId,
              client_id: clientId,
              points: entry.points,
              description: entry.description,
              type: entry.type,
              created_at: entry.created_at
          });
          if (error) console.error("Error adding points:", error);
      }
  };

  const generateVoucherCode = () => 'V-' + Math.random().toString(36).substr(2, 6).toUpperCase();

  const claimReward = (clientId: string, rewardId: string) => {
      const cp = getClientPoints(clientId);
      const reward = rewards.find(r => r.id === rewardId);
      
      if (!cp || !reward) return { success: false, message: 'Dados inválidos' };
      if (cp.totalPoints < reward.requiredPoints) return { success: false, message: 'Pontos insuficientes' };

      // 1. Create Redemption
      const redemption = {
          id: generateUUID(),
          tenant_id: tenantId,
          client_id: clientId,
          reward_id: rewardId,
          reward_name: reward.name,
          code: generateVoucherCode(),
          points_cost: reward.requiredPoints,
          status: 'active',
          redeemed_at: new Date().toISOString()
      };

      // 2. Deduct Points (Add negative history)
      const historyEntry = {
          id: generateUUID(),
          tenant_id: tenantId,
          client_id: clientId,
          points: -reward.requiredPoints, // Negative points for redemption
          description: `Resgate: ${reward.name}`,
          type: 'redeem',
          created_at: new Date().toISOString()
      };

      // Update Local
      setRedemptions(prev => [...prev, redemption as any]);
      setPointsHistory(prev => [...prev, historyEntry]);
      
      db.create('redemptions', redemption);
      db.create('points_history', historyEntry);

      // Update Supabase
      if (tenantId && isValidUUID(tenantId)) {
          supabase.from('redemptions').insert(redemption as any).then(({ error }) => {
              if(error) console.error("Redemption error", error);
          });
          supabase.from('points_history').insert(historyEntry).then(({ error }) => {
              if(error) console.error("Points history error", error);
          });
      }

      return { success: true, message: 'Recompensa resgatada!', voucherCode: redemption.code };
  };

  const useVoucher = (code: string, workOrderId: string) => {
      const redemption = redemptions.find(r => r.code === code && r.status === 'active');
      if (!redemption) return false;

      const updates = { status: 'used', used_at: new Date().toISOString(), used_in_work_order_id: workOrderId };
      
      setRedemptions(prev => prev.map(r => r.id === redemption.id ? { ...r, ...updates } : r) as any);
      db.update('redemptions', redemption.id, updates);

      if (tenantId && isValidUUID(tenantId)) {
          supabase.from('redemptions').update(updates).eq('id', redemption.id);
      }
      return true;
  };

  const getVoucherDetails = (code: string) => {
      const redemption = redemptions.find(r => r.code === code);
      if (!redemption) return null;
      const reward = rewards.find(r => r.id === redemption.rewardId);
      return { redemption, reward };
  };

  // --- CLIENT METRICS ---
  const recalculateClientMetrics = async (clientId: string) => {
      const clientOrders = workOrders.filter(os => os.clientId === clientId && (os.status === 'Concluído' || os.status === 'Entregue'));
      const visitCount = clientOrders.length;
      const ltv = clientOrders.reduce((acc, os) => acc + (os.totalValue || 0), 0);
      
      let lastVisit = null;
      if (clientOrders.length > 0) {
          const dates = clientOrders.map(os => new Date(os.createdAt || os.paidAt || '').getTime()).filter(d => !isNaN(d));
          if (dates.length > 0) {
              lastVisit = new Date(Math.max(...dates)).toISOString();
          }
      }

      // Update Local
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, ltv, visitCount, lastVisit: lastVisit || c.lastVisit } : c));
      
      // Update DB
      await db.update('clients', clientId, { ltv, visitCount, lastVisit: lastVisit || undefined });
      
      // Update Supabase
      if (tenantId && isValidUUID(tenantId)) {
          await supabase.from('clients').update({ 
              ltv, 
              visit_count: visitCount,
              last_visit: lastVisit 
          }).eq('id', clientId);
      }
  };

  const updateClientLTV = (clientId: string, amount: number) => {
      recalculateClientMetrics(clientId);
  };

  const updateClientVisits = (clientId: string, amount: number) => {
      recalculateClientMetrics(clientId);
  };

  // ... (Rest of the file remains same) ...
  const login = (pin: string) => { const employee = employees.find(e => e.pin === pin && e.active); if (employee) { setCurrentUser(employee); return true; } return false; };
  const logout = () => setCurrentUser(null);
  const loginOwner = async (email: string, password: string) => { const users = await db.getAll<any>('users'); const user = users.find(u => u.email === email && u.password === password); if (user) { setOwnerUser(user); localStorage.setItem('cristal_care_user', JSON.stringify(user)); const tenants = await db.getAll<any>('tenants'); const tenant = tenants.find(t => t.owner_id === user.id); if (tenant) await loadTenantData(tenant); return { success: true }; } return { success: false, error: { message: 'Credenciais inválidas' } }; };
  const logoutOwner = async () => { setOwnerUser(null); setTenantId(null); localStorage.removeItem('cristal_care_user'); window.location.href = '/login'; };
  const registerOwner = async (name: string, email: string, shopName: string, password: string) => { const userId = generateUUID(); const tenantId = generateUUID(); const newUser = { id: userId, name, email, password, shopName }; await db.create('users', newUser); const newTenant = { id: tenantId, name: shopName, slug: shopName.toLowerCase().replace(/\s+/g, '-'), owner_id: userId, plan_id: 'trial', status: 'active', settings: initialCompanySettings, subscription: initialSubscription, created_at: new Date().toISOString() }; await db.create('tenants', newTenant); return { success: true }; };
  const checkPermission = () => true;
  const checkLimit = () => true;
  const planLimits = { maxEmployees: 99 };
  const buyTokens = () => {};
  const consumeTokens = () => true;
  const changePlan = () => {};
  const cancelSubscription = async () => {};
  const forceSyncToCloud = async () => {};
  const connectWhatsapp = async () => {};
  const disconnectWhatsapp = async () => {};
  const simulateWhatsappScan = () => {};
  const updateOwner = async () => true;
  const createTenant = async () => true;
  const reloadUserData = async () => true;
  const submitNPS = () => {};
  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'status'>) => {
    try {
        const newItem = {
            ...item,
            id: Date.now(), 
            status: item.stock <= item.minStock ? (item.stock === 0 ? 'critical' : 'warning') : 'ok',
            tenant_id: tenantId
        };
        setInventory(prev => [...prev, newItem as InventoryItem]);
        await db.create('inventory', newItem);
        if (tenantId && isValidUUID(tenantId)) {
            await supabase.from('inventory').insert({
                tenant_id: tenantId,
                name: newItem.name,
                category: newItem.category,
                stock: newItem.stock,
                unit: newItem.unit,
                min_stock: newItem.minStock,
                cost_price: newItem.costPrice,
                status: newItem.status
            });
        }
    } catch (error) { console.error("Error adding inventory item:", error); }
  };
  const updateInventoryItem = async (id: number, updates: Partial<InventoryItem>) => {
    try {
        let newStatus = updates.status;
        if (updates.stock !== undefined || updates.minStock !== undefined) {
            const currentItem = inventory.find(i => String(i.id) === String(id));
            const stock = updates.stock !== undefined ? updates.stock : currentItem?.stock || 0;
            const min = updates.minStock !== undefined ? updates.minStock : currentItem?.minStock || 0;
            newStatus = stock <= min ? (stock === 0 ? 'critical' : 'warning') : 'ok';
        }
        const finalUpdates = { ...updates, status: newStatus };
        setInventory(prev => prev.map(item => String(item.id) === String(id) ? { ...item, ...finalUpdates } : item));
        await db.update('inventory', id, finalUpdates);
        if (tenantId && isValidUUID(tenantId)) {
            const payload: any = {};
            if (finalUpdates.name) payload.name = finalUpdates.name;
            if (finalUpdates.category) payload.category = finalUpdates.category;
            if (finalUpdates.stock !== undefined) payload.stock = finalUpdates.stock;
            if (finalUpdates.unit) payload.unit = finalUpdates.unit;
            if (finalUpdates.minStock !== undefined) payload.min_stock = finalUpdates.minStock;
            if (finalUpdates.costPrice !== undefined) payload.cost_price = finalUpdates.costPrice;
            if (finalUpdates.status) payload.status = finalUpdates.status;
            await supabase.from('inventory').update(payload).eq('id', id);
        }
    } catch (error) { console.error("Error updating inventory item:", error); }
  };
  const deleteInventoryItem = async (id: number) => {
    const idAsString = String(id);
    setInventory(prev => prev.filter(item => String(item.id) !== idAsString));
    setServiceConsumptions(prev => {
        const updatedConsumptions = prev.map(sc => ({
            ...sc,
            items: sc.items.filter(item => String(item.inventoryId) !== idAsString)
        }));
        updatedConsumptions.forEach(async (sc) => {
            const original = prev.find(p => p.serviceId === sc.serviceId);
            if (original && original.items.length !== sc.items.length) {
                const service = servicesRef.current.find(s => s.id === sc.serviceId);
                if (service) {
                    const updatedService = {
                        ...service,
                        price_matrix: { ...service.price_matrix, consumption: sc.items }
                    };
                    await db.update('services', service.id, updatedService);
                    if (tenantId && isValidUUID(tenantId)) {
                        await supabase.from('services').update({ price_matrix: updatedService.price_matrix }).eq('id', service.id);
                    }
                }
            }
        });
        return updatedConsumptions;
    });
    try {
        await db.delete('inventory', id);
        if (tenantId && isValidUUID(tenantId)) {
            await supabase.from('inventory').delete().eq('id', id);
        }
    } catch (error) { console.error("Error deleting item:", error); }
  };
  const deductStock = (serviceId: string) => {
      const consumption = serviceConsumptions.find(sc => sc.serviceId === serviceId);
      if (!consumption) return;
      consumption.items.forEach(item => {
          const invItem = inventory.find(i => String(i.id) === String(item.inventoryId));
          if (invItem) {
              let qtyToDeduct = item.quantity;
              if (invItem.unit === 'L' && item.usageUnit === 'ml') qtyToDeduct /= 1000;
              if (invItem.unit === 'kg' && item.usageUnit === 'g') qtyToDeduct /= 1000;
              const newStock = Math.max(0, invItem.stock - qtyToDeduct);
              updateInventoryItem(invItem.id, { stock: newStock });
          }
      });
  };
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const generateReminders = async (os: WorkOrder) => {
      if (!os.serviceId && (!os.serviceIds || os.serviceIds.length === 0)) return;
      const ids = os.serviceIds || [os.serviceId!];
      for (const sId of ids) {
          const service = services.find(s => s.id === sId);
          if (service && service.returnIntervalDays && service.returnIntervalDays > 0) {
              const dueDate = addDays(new Date(), service.returnIntervalDays).toISOString();
              const newReminder: Reminder = {
                  id: `rem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  clientId: os.clientId,
                  vehicleId: '', 
                  serviceType: `Retorno: ${service.name}`,
                  dueDate: dueDate,
                  status: 'pending',
                  createdAt: new Date().toISOString(),
                  autoGenerated: true,
                  tenant_id: tenantId
              };
              const client = clients.find(c => c.id === os.clientId);
              const vehicle = client?.vehicles.find(v => v.plate === os.plate);
              if (vehicle) newReminder.vehicleId = vehicle.id;
              setReminders(prev => [...prev, newReminder]);
              await db.create('reminders', newReminder);
              if (tenantId && isValidUUID(tenantId)) {
                  await supabase.from('reminders').insert({
                      id: newReminder.id,
                      tenant_id: tenantId,
                      client_id: newReminder.clientId,
                      vehicle_id: newReminder.vehicleId,
                      service_type: newReminder.serviceType,
                      due_date: newReminder.dueDate,
                      status: newReminder.status,
                      auto_generated: newReminder.autoGenerated,
                      created_at: newReminder.createdAt
                  });
              }
          }
      }
  };
  const addService = async (service: Partial<ServiceCatalogItem>) => {
    try {
        const newService = {
            ...service,
            id: service.id || generateUUID(),
            created_at: new Date().toISOString(),
            tenant_id: tenantId
        } as ServiceCatalogItem;
        setServices(prev => [...prev, newService]);
        await db.create('services', newService);
        if (tenantId && isValidUUID(tenantId)) {
            await supabase.from('services').insert({
                id: newService.id,
                tenant_id: tenantId,
                name: newService.name,
                category: newService.category,
                description: newService.description,
                standard_time: newService.standardTimeMinutes,
                active: newService.active,
                price_matrix: newService.price_matrix || {},
                return_interval_days: newService.returnIntervalDays,
                show_on_landing_page: newService.showOnLandingPage,
                image_url: newService.imageUrl
            });
        }
        return true;
    } catch (error) { console.error("Error adding service:", error); return false; }
  };
  const updateService = async (id: string, updates: Partial<ServiceCatalogItem>) => {
    try {
        setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
        await db.update('services', id, updates);
        if (tenantId && isValidUUID(tenantId)) {
            const payload: any = {};
            if (updates.name) payload.name = updates.name;
            if (updates.category) payload.category = updates.category;
            if (updates.description !== undefined) payload.description = updates.description;
            if (updates.standardTimeMinutes !== undefined) payload.standard_time = updates.standardTimeMinutes;
            if (updates.active !== undefined) payload.active = updates.active;
            if (updates.returnIntervalDays !== undefined) payload.return_interval_days = updates.returnIntervalDays;
            if (updates.showOnLandingPage !== undefined) payload.show_on_landing_page = updates.showOnLandingPage;
            if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
            if (updates.price_matrix) payload.price_matrix = updates.price_matrix;
            await supabase.from('services').update(payload).eq('id', id);
        }
        return true;
    } catch (error) { console.error("Error updating service:", error); return false; }
  };
  const deleteService = async (id: string) => {
    try {
        setServices(prev => prev.filter(s => s.id !== id));
        await db.delete('services', id);
        if (tenantId && isValidUUID(tenantId)) {
            await supabase.from('services').delete().eq('id', id);
        }
        return true;
    } catch (error) { console.error("Error deleting service:", error); return false; }
  };
  const updatePrice = async (serviceId: string, size: VehicleSize, newPrice: number) => {
    setPriceMatrix(prev => {
        const index = prev.findIndex(p => p.serviceId === serviceId && p.size === size);
        if (index >= 0) {
            const newMatrix = [...prev];
            newMatrix[index] = { ...newMatrix[index], price: newPrice };
            return newMatrix;
        } else {
            return [...prev, { serviceId, size, price: newPrice }];
        }
    });
    const service = services.find(s => s.id === serviceId);
    if (service) {
        const updatedPrices = { ...(service.price_matrix?.prices || {}), [size]: newPrice };
        const updatedService = {
            ...service,
            price_matrix: {
                ...service.price_matrix,
                prices: updatedPrices
            }
        };
        setServices(prev => prev.map(s => s.id === serviceId ? updatedService : s));
        await db.update('services', serviceId, updatedService);
        if (tenantId && isValidUUID(tenantId)) {
            await supabase.from('services').update({ price_matrix: updatedService.price_matrix }).eq('id', serviceId);
        }
    }
  };
  const updateServiceInterval = async (serviceId: string, days: number) => {
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, returnIntervalDays: days } : s));
      await db.update('services', serviceId, { returnIntervalDays: days });
      if (tenantId && isValidUUID(tenantId)) {
          await supabase.from('services').update({ return_interval_days: days }).eq('id', serviceId);
      }
  };
  const bulkUpdatePrices = async (targetSize: VehicleSize | 'all', percentage: number) => {
      const multiplier = 1 + (percentage / 100);
      setPriceMatrix(prev => prev.map(entry => {
          if (targetSize === 'all' || entry.size === targetSize) {
              return { ...entry, price: Math.ceil(entry.price * multiplier) };
          }
          return entry;
      }));
      const updatedServices = services.map(service => {
          const currentPrices = service.price_matrix?.prices || {};
          const newPrices = { ...currentPrices };
          let changed = false;
          Object.keys(currentPrices).forEach(key => {
              const sizeKey = key as VehicleSize;
              if (targetSize === 'all' || sizeKey === targetSize) {
                  newPrices[sizeKey] = Math.ceil(currentPrices[sizeKey] * multiplier);
                  changed = true;
              }
          });
          if (changed) {
              return {
                  ...service,
                  price_matrix: { ...service.price_matrix, prices: newPrices }
              };
          }
          return service;
      });
      setServices(updatedServices);
      for (const service of updatedServices) {
          if (service !== services.find(s => s.id === service.id)) {
               await db.update('services', service.id, service);
               if (tenantId && isValidUUID(tenantId)) {
                   await supabase.from('services').update({ price_matrix: service.price_matrix }).eq('id', service.id);
               }
          }
      }
  };
  const getPrice = (serviceId: string, size: VehicleSize) => {
      const entry = priceMatrix.find(p => p.serviceId === serviceId && p.size === size);
      return entry ? entry.price : 0;
  };
  const calculateServiceCost = (serviceId: string) => {
      const consumption = getServiceConsumption(serviceId);
      if (!consumption) return 0;
      return consumption.items.reduce((total, item) => {
          const invItem = inventory.find(i => String(i.id) === String(item.inventoryId));
          if (!invItem) return total;
          let multiplier = 1;
          if (invItem.unit === 'L' && item.usageUnit === 'ml') multiplier = 0.001;
          else if (invItem.unit === 'kg' && item.usageUnit === 'g') multiplier = 0.001;
          else if (invItem.unit === 'ml' && item.usageUnit === 'L') multiplier = 1000;
          else if (invItem.unit === 'g' && item.usageUnit === 'kg') multiplier = 1000;
          return total + (invItem.costPrice * item.quantity * multiplier);
      }, 0);
  };
  const addWorkOrder = async (os: WorkOrder) => {
    try {
      const newOS = { ...os, tenant_id: tenantId };
      setWorkOrders(prev => [...prev, newOS]);
      await db.create('work_orders', newOS);
      if (tenantId && isValidUUID(tenantId)) {
        if (isValidUUID(newOS.id)) {
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
              nps_score: newOS.npsScore,
              json_data: newOS
            });
            if (error) console.error("Supabase insert error:", error);
        } else { console.warn("Skipping Supabase insert: WorkOrder ID is not a valid UUID", newOS.id); }
      }
      return true;
    } catch (error) { console.error("Error adding work order:", error); return false; }
  };
  const updateWorkOrder = async (id: string, updates: Partial<WorkOrder>) => {
    try {
      setWorkOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
      const currentOS = workOrders.find(o => o.id === id);
      if (!currentOS) return false;
      const updatedOS = { ...currentOS, ...updates };
      await db.update('work_orders', id, updates);
      if (tenantId && isValidUUID(tenantId)) {
        if (isValidUUID(id)) {
            const payload: any = { json_data: updatedOS };
            if (updates.clientId) payload.client_id = updates.clientId;
            if (updates.plate) payload.vehicle_plate = updates.plate;
            if (updates.service) payload.service_summary = updates.service;
            if (updates.status) payload.status = updates.status;
            if (updates.totalValue !== undefined) payload.total_value = updates.totalValue;
            if (updates.technician) payload.technician = updates.technician;
            if (updates.deadline) payload.deadline = updates.deadline;
            if (updates.paymentStatus) payload.payment_status = updates.paymentStatus;
            if (updates.paymentMethod) payload.payment_method = updates.paymentMethod;
            if (updates.npsScore !== undefined) payload.nps_score = updates.npsScore;
            const { error } = await supabase.from('work_orders').update(payload).eq('id', id);
            if (error) console.error("Supabase update error:", error);
        } else { console.warn("Skipping Supabase update: WorkOrder ID is not a valid UUID", id); }
      }
      return true;
    } catch (error) { console.error("Error updating work order:", error); return false; }
  };
  const completeWorkOrder = async (id: string, orderSnapshot?: WorkOrder) => {
      const os = orderSnapshot || workOrders.find(o => o.id === id);
      if (!os) return;
      if (os.serviceIds) { os.serviceIds.forEach(sId => deductStock(sId)); } else if (os.serviceId) { deductStock(os.serviceId); }
      // Reminders are now generated upon payment, not completion
      if (os.clientId) { await recalculateClientMetrics(os.clientId); }
  };
  
  // --- EMPLOYEE FUNCTIONS ---
  const addEmployee = async (employee: Omit<Employee, 'id' | 'balance'>) => {
    try {
        const newEmployee: Employee = {
            ...employee,
            id: generateUUID(),
            balance: 0,
            tenant_id: tenantId || undefined,
            created_at: new Date().toISOString()
        } as Employee;

        setEmployees(prev => [...prev, newEmployee]);
        await db.create('employees', newEmployee);

        if (tenantId && isValidUUID(tenantId)) {
            await supabase.from('employees').insert({
                id: newEmployee.id,
                tenant_id: tenantId,
                name: newEmployee.name,
                role: newEmployee.role,
                pin: newEmployee.pin,
                active: newEmployee.active,
                balance: newEmployee.balance,
                created_at: newEmployee.created_at || new Date().toISOString(),
                salary_data: {
                    salaryType: newEmployee.salaryType,
                    fixedSalary: newEmployee.fixedSalary,
                    commissionRate: newEmployee.commissionRate,
                    commissionBase: newEmployee.commissionBase
                }
            });
        }
    } catch (error) {
        console.error("Error adding employee:", error);
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
      try {
          setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
          await db.update('employees', id, updates);

          if (tenantId && isValidUUID(tenantId)) {
              const currentEmployee = employees.find(e => e.id === id);
              const merged = { ...currentEmployee, ...updates };
              
              const payload: any = {
                  name: merged.name,
                  role: merged.role,
                  pin: merged.pin,
                  active: merged.active,
                  balance: merged.balance,
                  salary_data: {
                      salaryType: merged.salaryType,
                      fixedSalary: merged.fixedSalary,
                      commissionRate: merged.commissionRate,
                      commissionBase: merged.commissionBase
                  }
              };
              
              await supabase.from('employees').update(payload).eq('id', id);
          }
      } catch (error) {
          console.error("Error updating employee:", error);
      }
  };

  const deleteEmployee = async (id: string) => {
      try {
          setEmployees(prev => prev.filter(e => e.id !== id));
          await db.delete('employees', id);
          
          if (tenantId && isValidUUID(tenantId)) {
              await supabase.from('employees').delete().eq('id', id);
          }
      } catch (error) {
          console.error("Error deleting employee:", error);
      }
  };

  const assignTask = () => {};
  const startTask = () => {};
  const stopTask = () => {};
  const addEmployeeTransaction = () => {};
  const updateEmployeeTransaction = () => {};
  const deleteEmployeeTransaction = () => {};
  const addFinancialTransaction = () => {};
  const updateFinancialTransaction = () => {};
  const deleteFinancialTransaction = () => {};
  const createCampaign = () => {};
  const updateCampaign = () => {};
  const deleteCampaign = () => {};
  const seedDefaultCampaigns = async () => {};
  const seedMockReviews = async () => {};
  
  // FIX: Sanitized WhatsApp Link
  const getWhatsappLink = (phone: string, msg: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    // Assume Brazil (55) if length is 10 or 11 (DD + Number)
    const finalPhone = (cleanPhone.length === 10 || cleanPhone.length === 11) 
      ? `55${cleanPhone}` 
      : cleanPhone;
      
    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`;
  };

  const createSocialPost = () => {};
  const generateSocialContent = async () => ({ caption: '', hashtags: [] });
  const getClientPoints = (id: string) => clientPoints.find(cp => cp.clientId === id);
  const createFidelityCard = async (clientId: string) => { return {} as FidelityCard; };
  const getFidelityCard = (clientId: string) => fidelityCards.find(c => c.clientId === clientId);
  const addReward = () => {};
  const updateReward = () => {};
  const deleteReward = () => {};
  const getRewardsByLevel = (level: TierLevel) => rewards.filter(r => r.requiredLevel === level || (level === 'platinum' && r.requiredLevel !== 'platinum'));
  const updateTierConfig = () => {};
  const getClientRedemptions = (clientId: string) => redemptions.filter(r => r.clientId === clientId);
  const generatePKPass = () => '';
  const generateGoogleWallet = () => '';
  const seedDefaultRewards = async () => {};
  const markNotificationAsRead = () => {};
  const clearAllNotifications = () => {};
  const addNotification = () => {};
  const markAlertResolved = () => {};
  const updateServiceConsumption = async (consumption: ServiceConsumption) => {
      setServiceConsumptions(prev => {
          const index = prev.findIndex(sc => sc.serviceId === consumption.serviceId);
          if (index >= 0) {
              const newConsumptions = [...prev];
              newConsumptions[index] = consumption;
              return newConsumptions;
          }
          return [...prev, consumption];
      });
      const service = services.find(s => s.id === consumption.serviceId);
      if (service) {
          const updatedService = {
              ...service,
              price_matrix: { ...service.price_matrix, consumption: consumption.items }
          };
          await db.update('services', service.id, updatedService);
          if (tenantId && isValidUUID(tenantId)) {
              await supabase.from('services').update({ price_matrix: updatedService.price_matrix }).eq('id', service.id);
          }
      }
      return true;
  };
  const getServiceConsumption = (serviceId: string) => serviceConsumptions.find(sc => sc.serviceId === serviceId);

  return (
    <AppContext.Provider value={{
      inventory, workOrders, clients, recipes, reminders, services, priceMatrix, employees,
      employeeTransactions, financialTransactions, clientPoints, fidelityCards, rewards,
      redemptions, serviceConsumptions, currentUser, ownerUser, tenantId, isAppLoading,
      theme, campaigns, socialPosts, notifications, systemAlerts, companySettings,
      subscription, messageLogs,
      markNotificationAsRead, clearAllNotifications, addNotification, markAlertResolved,
      updateCompanySettings, checkPermission, checkLimit, planLimits, buyTokens, consumeTokens,
      changePlan, cancelSubscription, forceSyncToCloud, connectWhatsapp, disconnectWhatsapp,
      simulateWhatsappScan, login, logout, loginOwner, registerOwner, logoutOwner, updateOwner,
      createTenant, reloadUserData, addWorkOrder, updateWorkOrder, completeWorkOrder,
      recalculateClientMetrics, updateClientLTV, updateClientVisits, submitNPS, addClient,
      updateClient, deleteClient, addVehicle, updateVehicle, removeVehicle, addInventoryItem,
      updateInventoryItem, deleteInventoryItem, deductStock, toggleTheme, generateReminders,
      addService, updateService, deleteService, updatePrice, updateServiceInterval,
      bulkUpdatePrices, getPrice, updateServiceConsumption, getServiceConsumption,
      calculateServiceCost, addEmployee, updateEmployee, deleteEmployee, assignTask,
      startTask, stopTask, addEmployeeTransaction, updateEmployeeTransaction,
      deleteEmployeeTransaction, addFinancialTransaction, updateFinancialTransaction,
      deleteFinancialTransaction, createCampaign, updateCampaign, deleteCampaign,
      seedDefaultCampaigns, seedMockReviews, getWhatsappLink, createSocialPost,
      generateSocialContent, addPointsToClient, getClientPoints, createFidelityCard,
      getFidelityCard, addReward, updateReward, deleteReward, getRewardsByLevel,
      updateTierConfig, claimReward, getClientRedemptions, useVoucher, getVoucherDetails,
      generatePKPass, generateGoogleWallet, seedDefaultRewards
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
}
