import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Client, InventoryItem, WorkOrder, ServiceRecipe, Reminder, Vehicle, 
  ServiceCatalogItem, PriceMatrixEntry, VehicleSize, Employee, Task, 
  TimeLog, EmployeeTransaction, MarketingCampaign, ClientSegment,
  CompanySettings, SubscriptionDetails, FinancialTransaction, ClientPoints, FidelityCard, Reward,
  Redemption, TierConfig, TierLevel, ShopOwner, Notification, ServiceConsumption
} from '../types';
import { differenceInDays, addDays, subDays, formatISO, startOfWeek, addHours } from 'date-fns';

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
  
  currentUser: Employee | null; // Tech Portal User
  ownerUser: ShopOwner | null; // Admin/Shop Owner User
  
  theme: 'light' | 'dark';
  campaigns: MarketingCampaign[];
  
  // Notifications
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  
  // SaaS & Config
  companySettings: CompanySettings;
  subscription: SubscriptionDetails;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  
  // WhatsApp Actions
  connectWhatsapp: () => void;
  disconnectWhatsapp: () => void;
  
  // Actions
  login: (pin: string) => boolean; // Tech Login
  logout: () => void; // Tech Logout
  
  loginOwner: (email: string, password: string) => boolean;
  registerOwner: (name: string, email: string, shopName: string) => void;
  logoutOwner: () => void;

  addWorkOrder: (os: WorkOrder) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  completeWorkOrder: (id: string) => void;
  submitNPS: (workOrderId: string, score: number, comment?: string) => void;
  
  addClient: (client: Partial<Client>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  addVehicle: (clientId: string, vehicle: Vehicle) => void;
  
  // Inventory Actions
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'status'>) => void;
  updateInventoryItem: (id: number, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: number) => void;
  deductStock: (serviceId: string) => void;
  
  toggleTheme: () => void;
  generateReminders: (os: WorkOrder) => void;
  
  // Service & Pricing Actions
  addService: (service: Partial<ServiceCatalogItem>) => void;
  updateService: (id: string, updates: Partial<ServiceCatalogItem>) => void;
  deleteService: (id: string) => void; 
  updatePrice: (serviceId: string, size: VehicleSize, newPrice: number) => void;
  updateServiceInterval: (serviceId: string, days: number) => void;
  bulkUpdatePrices: (targetSize: VehicleSize | 'all', percentage: number) => void;
  getPrice: (serviceId: string, size: VehicleSize) => number;
  
  // Consumption/Recipe Actions
  updateServiceConsumption: (consumption: ServiceConsumption) => void;
  getServiceConsumption: (serviceId: string) => ServiceConsumption | undefined;
  calculateServiceCost: (serviceId: string) => number;

  // HR Actions
  addEmployee: (employee: Omit<Employee, 'id' | 'balance'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  assignTask: (workOrderId: string, serviceId: string, employeeId: string) => void;
  startTask: (taskId: string) => void;
  stopTask: (taskId: string) => void;
  addEmployeeTransaction: (trans: EmployeeTransaction) => void;
  updateEmployeeTransaction: (id: string, updates: Partial<EmployeeTransaction>) => void; 
  deleteEmployeeTransaction: (id: string) => void; 

  // Finance Actions
  addFinancialTransaction: (trans: FinancialTransaction) => void;
  updateFinancialTransaction: (id: number, updates: Partial<FinancialTransaction>) => void;
  deleteFinancialTransaction: (id: number) => void;

  // Marketing Actions
  createCampaign: (campaign: MarketingCampaign) => void;
  getWhatsappLink: (phone: string, message: string) => string;

  // Gamification Actions
  addPointsToClient: (clientId: string, workOrderId: string, points: number, description: string) => void;
  getClientPoints: (clientId: string) => ClientPoints | undefined;
  createFidelityCard: (clientId: string) => FidelityCard;
  getFidelityCard: (clientId: string) => FidelityCard | undefined;
  
  // Rewards Actions
  addReward: (reward: Omit<Reward, 'id' | 'createdAt'>) => void;
  updateReward: (id: string, updates: Partial<Reward>) => void;
  deleteReward: (id: string) => void;
  getRewardsByLevel: (level: TierLevel) => Reward[];
  
  // Tier Management
  updateTierConfig: (tiers: TierConfig[]) => void;
  
  // Redemption / Voucher
  claimReward: (clientId: string, rewardId: string) => { success: boolean; message: string; voucherCode?: string };
  getClientRedemptions: (clientId: string) => Redemption[];
  useVoucher: (code: string, workOrderId: string) => boolean;
  getVoucherDetails: (code: string) => { redemption: Redemption; reward: Reward | undefined } | null;

  generatePKPass: (clientId: string) => string;
  generateGoogleWallet: (clientId: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- HELPER: LOCAL STORAGE ---
const getStorage = <T,>(key: string, initial: T): T => {
  try {
    const item = localStorage.getItem(`crystal_care_${key}`);
    return item ? JSON.parse(item) : initial;
  } catch (error) {
    console.error(`Error loading ${key} from storage`, error);
    return initial;
  }
};

const setStorage = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(`crystal_care_${key}`, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to storage`, error);
  }
};

// ... (Existing Mock Data)
const defaultTiers: TierConfig[] = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, color: 'from-amber-500 to-amber-600', benefits: ['5% desconto em serviços'] },
  { id: 'silver', name: 'Prata', minPoints: 500, color: 'from-slate-400 to-slate-600', benefits: ['10% desconto', 'Frete grátis'] },
  { id: 'gold', name: 'Ouro', minPoints: 1500, color: 'from-yellow-500 to-yellow-600', benefits: ['15% desconto', 'Atendimento VIP'] },
  { id: 'platinum', name: 'Platina', minPoints: 3000, color: 'from-blue-500 to-blue-600', benefits: ['20% desconto', 'Brinde exclusivo', 'Suporte 24h'] }
];

const initialCompanySettings: CompanySettings = {
  name: 'Cristal Care Autodetail',
  responsibleName: 'Anderson Silva',
  cnpj: '12.345.678/0001-90',
  email: 'contato@cristalcare.com.br',
  phone: '(11) 99999-8888',
  address: 'Av. Automotiva, 1000 - Jardins, SP',
  logoUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=150&q=80',
  website: 'www.cristalcare.com.br',
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
  initialBalance: 15000.00,
  whatsapp: {
    enabled: true,
    session: {
      status: 'disconnected'
    },
    templates: {
      welcome: 'Olá {cliente}! Bem-vindo à Cristal Care. Seu cadastro foi realizado com sucesso.',
      completion: 'Olá {cliente}! O serviço no seu {veiculo} foi concluído. Valor Total: {valor}. Aguardamos sua retirada!',
      nps: 'Olá {cliente}, como foi sua experiência com a Cristal Care? Responda de 0 a 10.',
      recall: 'Olá {cliente}, já faz um tempo que cuidamos do seu {veiculo}. Que tal renovar a proteção?'
    }
  },
  landingPage: {
    enabled: true,
    heroTitle: 'Estética Automotiva de Alto Padrão',
    heroSubtitle: 'Cuidamos do seu carro com a excelência que ele merece. Agende agora e transforme seu veículo.',
    heroImage: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1920&q=80',
    primaryColor: '#2563eb',
    showServices: true,
    showTestimonials: true
  },
  preferences: {
    theme: 'dark',
    language: 'pt-BR',
    notifications: {
      lowStock: true,
      osUpdates: true,
      marketing: false
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
  planId: 'pro',
  status: 'active',
  nextBillingDate: formatISO(addDays(new Date(), 15)),
  paymentMethod: 'Mastercard final 4242',
  invoices: [
    { id: 'inv-001', date: formatISO(subDays(new Date(), 15)), amount: 299.90, status: 'paid', pdfUrl: '#' },
    { id: 'inv-002', date: formatISO(subDays(new Date(), 45)), amount: 299.90, status: 'paid', pdfUrl: '#' },
    { id: 'inv-003', date: formatISO(subDays(new Date(), 75)), amount: 299.90, status: 'paid', pdfUrl: '#' },
  ]
};

const today = new Date();
const yesterday = subDays(today, 1);
const initialClients: Client[] = [
  { 
    id: 'c1', name: 'Dr. Roberto Silva', phone: '11999998888', email: 'roberto.med@email.com', notes: 'Cliente VIP. Exigente com acabamento interno.',
    vehicles: [
      { id: 'v1', model: 'Porsche Macan', plate: 'POR-9111', color: 'Cinza Nardo', year: '2023', size: 'large' },
      { id: 'v2', model: 'BMW X5', plate: 'BMW-5588', color: 'Preto Obsidiana', year: '2022', size: 'large' }
    ],
    ltv: 15500.00, lastVisit: formatISO(yesterday), visitCount: 12, status: 'active', segment: 'vip'
  },
];
const initialReminders: Reminder[] = []; 
const initialEmployees: Employee[] = [
  { id: 'e1', name: 'Mestre Miyagi', role: 'Funileiro', pin: '1234', salaryType: 'commission', fixedSalary: 0, commissionRate: 30, commissionBase: 'net', active: true, balance: 3450.00 },
  { id: 'e5', name: 'Fernanda Gerente', role: 'Manager', pin: '9999', salaryType: 'fixed', fixedSalary: 3500, commissionRate: 0, commissionBase: 'gross', active: true, balance: 0 },
];

const initialServices: ServiceCatalogItem[] = [
    { 
      id: 'srv1', 
      name: 'Lavagem Técnica', 
      description: 'Limpeza detalhada de carroceria, rodas e caixas de roda com produtos biodegradáveis de pH neutro.', 
      category: 'Lavagem', 
      active: true, 
      standardTimeMinutes: 90, 
      returnIntervalDays: 30, 
      imageUrl: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80' 
    },
];

const initialPriceMatrix: PriceMatrixEntry[] = []; 

const initialInventory: InventoryItem[] = [
    { id: 1, name: 'Shampoo Neutro', category: 'Lavagem', stock: 50, unit: 'L', minStock: 20, status: 'ok', costPrice: 15.00 },
];

const initialWorkOrders: WorkOrder[] = [];
const initialEmployeeTransactions: EmployeeTransaction[] = [];
const initialCampaigns: MarketingCampaign[] = [];
const initialFinancialTransactions: FinancialTransaction[] = [];
const initialClientPoints: ClientPoints[] = [];
const initialFidelityCards: FidelityCard[] = [];
const initialRewards: Reward[] = [];
const initialRedemptions: Redemption[] = [];
const initialServiceConsumptions: ServiceConsumption[] = [];

export function AppProvider({ children }: { children: ReactNode }) {
  // State Initialization
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => getStorage('companySettings_v13', initialCompanySettings)); 
  const [subscription, setSubscription] = useState<SubscriptionDetails>(() => getStorage('subscription_v1', initialSubscription));
  
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getStorage('inventory_v10', initialInventory)); 
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => getStorage<WorkOrder[]>('workOrders_v8', initialWorkOrders));
  const [clients, setClients] = useState<Client[]>(() => getStorage<Client[]>('clients_v8', initialClients));
  const [reminders, setReminders] = useState<Reminder[]>(() => getStorage('reminders_v8', initialReminders));
  
  const [services, setServices] = useState<ServiceCatalogItem[]>(() => getStorage('services_v10', initialServices));
  const [priceMatrix, setPriceMatrix] = useState<PriceMatrixEntry[]>(() => getStorage('priceMatrix_v8', initialPriceMatrix));
  const [serviceConsumptions, setServiceConsumptions] = useState<ServiceConsumption[]>(() => getStorage('serviceConsumptions_v1', initialServiceConsumptions));
  
  const [employees, setEmployees] = useState<Employee[]>(() => getStorage('employees_v9', initialEmployees)); 
  const [employeeTransactions, setEmployeeTransactions] = useState<EmployeeTransaction[]>(() => getStorage('employeeTransactions_v8', initialEmployeeTransactions));
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>(() => getStorage('financialTransactions_v3', initialFinancialTransactions));
  const [clientPoints, setClientPoints] = useState<ClientPoints[]>(() => getStorage('clientPoints_v1', initialClientPoints));
  const [fidelityCards, setFidelityCards] = useState<FidelityCard[]>(() => getStorage('fidelityCards_v1', initialFidelityCards));
  const [rewards, setRewards] = useState<Reward[]>(() => getStorage('rewards_v1', initialRewards));
  const [redemptions, setRedemptions] = useState<Redemption[]>(() => getStorage('redemptions_v1', initialRedemptions)); 

  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(() => getStorage<MarketingCampaign[]>('campaigns_v7', initialCampaigns));
  
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [ownerUser, setOwnerUser] = useState<ShopOwner | null>(() => getStorage('ownerUser', null)); 

  const [notifications, setNotifications] = useState<Notification[]>([
    { 
      id: 'welcome-msg', 
      title: 'Bem-vindo', 
      message: 'Sistema iniciado com sucesso.', 
      read: false, 
      createdAt: new Date().toISOString(), 
      type: 'info' 
    }
  ]);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const [theme, setTheme] = useState<'light' | 'dark'>(() => getStorage('theme', 'dark'));
  const [recipes] = useState<ServiceRecipe[]>([]);

  // Persistence
  useEffect(() => setStorage('companySettings_v13', companySettings), [companySettings]);
  useEffect(() => setStorage('subscription_v1', subscription), [subscription]);
  useEffect(() => setStorage('theme', theme), [theme]);
  useEffect(() => setStorage('reminders_v8', reminders), [reminders]); 
  useEffect(() => setStorage('services_v10', services), [services]);
  useEffect(() => setStorage('priceMatrix_v8', priceMatrix), [priceMatrix]); 
  useEffect(() => setStorage('inventory_v10', inventory), [inventory]);
  useEffect(() => setStorage('employees_v9', employees), [employees]); 
  useEffect(() => setStorage('employeeTransactions_v8', employeeTransactions), [employeeTransactions]);
  useEffect(() => setStorage('financialTransactions_v3', financialTransactions), [financialTransactions]);
  useEffect(() => setStorage('clientPoints_v1', clientPoints), [clientPoints]);
  useEffect(() => setStorage('fidelityCards_v1', fidelityCards), [fidelityCards]);
  useEffect(() => setStorage('rewards_v1', rewards), [rewards]);
  useEffect(() => setStorage('redemptions_v1', redemptions), [redemptions]);
  useEffect(() => setStorage('ownerUser', ownerUser), [ownerUser]); 
  useEffect(() => setStorage('serviceConsumptions_v1', serviceConsumptions), [serviceConsumptions]);

  // Check for points expiration on load
  useEffect(() => {
    const checkExpiration = () => {
      const oneYearAgo = subDays(new Date(), 365);
      
      setClientPoints(prev => prev.map(cp => {
        const oldPositivePoints = cp.pointsHistory
          .filter(h => h.points > 0 && new Date(h.date) < oneYearAgo)
          .reduce((acc, h) => acc + h.points, 0);
          
        const totalDeducted = cp.pointsHistory
          .filter(h => h.points < 0)
          .reduce((acc, h) => acc + Math.abs(h.points), 0);
          
        const pointsToExpire = Math.max(0, oldPositivePoints - totalDeducted);
        
        if (pointsToExpire > 0) {
          return {
            ...cp,
            totalPoints: cp.totalPoints - pointsToExpire,
            pointsHistory: [
              ...cp.pointsHistory,
              {
                id: `exp-${Date.now()}`,
                workOrderId: 'system',
                points: -pointsToExpire,
                description: 'Expiração de Pontos (> 1 ano)',
                date: new Date().toISOString()
              }
            ]
          };
        }
        return cp;
      }));
    };
    
    checkExpiration();
  }, []); 

  // RECOVERY LOGIC
  useEffect(() => {
    if (companySettings.whatsapp.session.status === 'scanning') {
      setCompanySettings(prev => ({
        ...prev,
        whatsapp: {
          ...prev.whatsapp,
          session: { 
            status: 'connected',
            device: {
              name: 'WhatsApp Web',
              number: prev.phone,
              battery: 92,
              avatarUrl: prev.logoUrl
            }
          }
        }
      }));
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  
  // --- TECH PORTAL AUTH ---
  const login = (pin: string) => {
    const user = employees.find(e => e.pin === pin);
    if (user) { setCurrentUser(user); return true; }
    return false;
  };
  const logout = () => setCurrentUser(null);

  // --- OWNER AUTH ---
  const loginOwner = (email: string, password: string) => {
    if (email && password) {
      const fakeOwner: ShopOwner = {
        id: 'owner-1',
        name: 'Admin Demo',
        email: email,
        shopName: companySettings.name
      };
      setOwnerUser(fakeOwner);
      return true;
    }
    return false;
  };

  const registerOwner = (name: string, email: string, shopName: string) => {
    const newOwner: ShopOwner = {
        id: `owner-${Date.now()}`,
        name,
        email,
        shopName
    };
    setOwnerUser(newOwner);
    
    setCompanySettings({
        ...initialCompanySettings,
        name: shopName,
        responsibleName: name,
        email: email
    });
  };

  const logoutOwner = () => {
    setOwnerUser(null);
  };

  const updateCompanySettings = (settings: Partial<CompanySettings>) => {
    setCompanySettings(prev => ({ ...prev, ...settings }));
  };

  const connectWhatsapp = () => {
    setCompanySettings(prev => ({
      ...prev,
      whatsapp: {
        ...prev.whatsapp,
        session: { status: 'scanning' }
      }
    }));

    setTimeout(() => {
      setCompanySettings(prev => ({
        ...prev,
        whatsapp: {
          ...prev.whatsapp,
          session: { 
            status: 'connected',
            device: {
              name: 'WhatsApp Web',
              number: prev.phone,
              battery: 85,
              avatarUrl: prev.logoUrl
            }
          }
        }
      }));
    }, 4000);
  };

  const disconnectWhatsapp = () => {
    setCompanySettings(prev => ({
      ...prev,
      whatsapp: {
        ...prev.whatsapp,
        session: { status: 'disconnected' }
      }
    }));
  };

  const generateReminders = (os: WorkOrder) => {
    const service = services.find(s => s.id === os.serviceId) || services.find(s => s.name === os.service);
    if (!service || !service.returnIntervalDays || service.returnIntervalDays <= 0) return;

    const client = clients.find(c => c.id === os.clientId);
    if (!client) return;
    const vehicle = client.vehicles.find(v => v.plate === os.plate);
    const vehicleId = vehicle ? vehicle.id : 'unknown';

    const dueDate = addDays(new Date(), service.returnIntervalDays);
    
    const newReminder: Reminder = {
      id: `rem-${Date.now()}`,
      clientId: os.clientId,
      vehicleId: vehicleId,
      serviceType: service.name,
      dueDate: formatISO(dueDate),
      status: 'pending',
      createdAt: new Date().toISOString(),
      autoGenerated: true
    };

    setReminders(prev => [...prev, newReminder]);
  };

  const addWorkOrder = (os: WorkOrder) => setWorkOrders(prev => [os, ...prev]);
  const updateWorkOrder = (id: string, updates: Partial<WorkOrder>) => setWorkOrders(prev => prev.map(os => os.id === id ? { ...os, ...updates } : os));
  const addClient = (client: Partial<Client>) => setClients(prev => [...prev, { id: `c-${Date.now()}`, vehicles: [], ltv: 0, lastVisit: new Date().toISOString(), visitCount: 0, status: 'active', segment: 'new', name: '', phone: '', email: '', ...client } as Client]);
  const updateClient = (id: string, updates: Partial<Client>) => setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  const addVehicle = (clientId: string, vehicle: Vehicle) => setClients(prev => prev.map(c => c.id === clientId ? { ...c, vehicles: [...c.vehicles, vehicle] } : c));
  
  // --- INVENTORY ACTIONS ---
  const calculateStatus = (stock: number, minStock: number): 'ok' | 'warning' | 'critical' => {
    if (stock <= minStock) return 'critical';
    if (stock <= minStock * 1.5) return 'warning';
    return 'ok';
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id' | 'status'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: Date.now(),
      status: calculateStatus(item.stock, item.minStock)
    };
    setInventory(prev => [...prev, newItem]);
  };

  const updateInventoryItem = (id: number, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };
        updatedItem.status = calculateStatus(updatedItem.stock, updatedItem.minStock);
        return updatedItem;
      }
      return item;
    }));
  };

  const deleteInventoryItem = (id: number) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  // --- CONSUMPTION & STOCK DEDUCTION LOGIC ---
  
  const updateServiceConsumption = (consumption: ServiceConsumption) => {
    setServiceConsumptions(prev => {
      const existing = prev.findIndex(c => c.serviceId === consumption.serviceId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = consumption;
        return updated;
      }
      return [...prev, consumption];
    });
  };

  const getServiceConsumption = (serviceId: string) => serviceConsumptions.find(c => c.serviceId === serviceId);

  const calculateServiceCost = (serviceId: string): number => {
    const consumption = getServiceConsumption(serviceId);
    if (!consumption) return 0;

    return consumption.items.reduce((total, item) => {
      const invItem = inventory.find(i => i.id === item.inventoryId);
      if (!invItem) return total;

      // Basic unit conversion logic
      let multiplier = 1;
      
      // If stock is in Liters and usage is in ml
      if (invItem.unit.toLowerCase() === 'l' && item.usageUnit === 'ml') {
        multiplier = 0.001;
      } 
      // If stock is in kg and usage is in g
      else if (invItem.unit.toLowerCase() === 'kg' && item.usageUnit === 'g') {
        multiplier = 0.001;
      }
      // If units match (e.g., un -> un, L -> L)
      else if (invItem.unit.toLowerCase() === item.usageUnit.toLowerCase()) {
        multiplier = 1;
      }
      // Fallback for mismatched units without clear conversion (treat as 1:1)
      
      return total + (invItem.costPrice * item.quantity * multiplier);
    }, 0);
  };

  const deductStock = (serviceId: string) => {
    const consumption = getServiceConsumption(serviceId);
    if (!consumption) return;

    setInventory(prev => prev.map(invItem => {
      const consumptionItem = consumption.items.find(i => i.inventoryId === invItem.id);
      
      if (consumptionItem) {
        let deductionAmount = consumptionItem.quantity;
        
        // Apply conversion
        if (invItem.unit.toLowerCase() === 'l' && consumptionItem.usageUnit === 'ml') {
          deductionAmount = consumptionItem.quantity / 1000;
        } else if (invItem.unit.toLowerCase() === 'kg' && consumptionItem.usageUnit === 'g') {
          deductionAmount = consumptionItem.quantity / 1000;
        }

        const newStock = Math.max(0, invItem.stock - deductionAmount);
        
        return {
          ...invItem,
          stock: parseFloat(newStock.toFixed(3)), // Avoid float precision issues
          status: calculateStatus(newStock, invItem.minStock)
        };
      }
      return invItem;
    }));
  };
  
  // --- SERVICE ACTIONS ---
  const addService = (service: Partial<ServiceCatalogItem>) => {
    const newService = { id: `srv-${Date.now()}`, active: true, standardTimeMinutes: 60, returnIntervalDays: 0, ...service } as ServiceCatalogItem;
    setServices(prev => [...prev, newService]);
  };
  const updateService = (id: string, updates: Partial<ServiceCatalogItem>) => setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  
  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    setPriceMatrix(prev => prev.filter(p => p.serviceId !== id));
    setServiceConsumptions(prev => prev.filter(c => c.serviceId !== id));
  };

  const updatePrice = (serviceId: string, size: VehicleSize, newPrice: number) => setPriceMatrix(prev => { const exists = prev.find(p => p.serviceId === serviceId && p.size === size); return exists ? prev.map(p => p.serviceId === serviceId && p.size === size ? { ...p, price: newPrice } : p) : [...prev, { serviceId, size, price: newPrice }]; });
  const updateServiceInterval = (serviceId: string, days: number) => setServices(prev => prev.map(s => s.id === serviceId ? { ...s, returnIntervalDays: days } : s));
  const bulkUpdatePrices = (targetSize: VehicleSize | 'all', percentage: number) => { const factor = 1 + (percentage / 100); setPriceMatrix(prev => prev.map(entry => (targetSize === 'all' || entry.size === targetSize) ? { ...entry, price: Math.ceil(entry.price * factor) } : entry)); };
  const getPrice = (serviceId: string, size: VehicleSize) => priceMatrix.find(p => p.serviceId === serviceId && p.size === size)?.price || 0;
  
  // --- HR ACTIONS ---
  const addEmployee = (employee: Omit<Employee, 'id' | 'balance'>) => {
    const newEmp: Employee = { 
      ...employee, 
      id: `e-${Date.now()}`, 
      balance: 0,
      active: true 
    };
    setEmployees(prev => [...prev, newEmp]);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const assignTask = () => {}; const startTask = () => {}; const stopTask = () => {};
  
  const completeWorkOrder = (id: string) => {
      const os = workOrders.find(o => o.id === id);
      if (os) {
        // 1. Gamification Points
        if (companySettings.gamification?.enabled) {
            const points = Math.round(os.totalValue * (companySettings.gamification.pointsMultiplier || 1));
            addPointsToClient(os.clientId, id, points, `Serviço concluído: ${os.service}`);
        }
        
        // 2. Update Status
        updateWorkOrder(id, { status: 'Concluído' });
        
        // 3. Generate Reminders
        generateReminders(os); 
        
        // 4. Deduct Stock based on service recipe
        if (os.serviceId) {
            deductStock(os.serviceId);
        } else if (os.serviceIds && os.serviceIds.length > 0) {
            // Handle multi-service deduction
            os.serviceIds.forEach(sId => deductStock(sId));
        }
      }
  };
  
  const submitNPS = (workOrderId: string, score: number, comment?: string) => updateWorkOrder(workOrderId, { npsScore: score, npsComment: comment });
  
  const addEmployeeTransaction = (trans: EmployeeTransaction) => { 
    setEmployeeTransactions(prev => [...prev, trans]); 
    setEmployees(prev => prev.map(e => { 
        if (e.id === trans.employeeId) { 
            const change = (trans.type === 'commission' || trans.type === 'salary') ? trans.amount : -trans.amount; 
            return { ...e, balance: e.balance + change }; 
        } 
        return e; 
    })); 
  };

  const updateEmployeeTransaction = (id: string, updates: Partial<EmployeeTransaction>) => {
    const oldTrans = employeeTransactions.find(t => t.id === id);
    if (!oldTrans) return;

    const oldChange = (oldTrans.type === 'commission' || oldTrans.type === 'salary') ? -oldTrans.amount : oldTrans.amount;
    
    const newType = updates.type || oldTrans.type;
    const newAmount = updates.amount !== undefined ? updates.amount : oldTrans.amount;
    const newChange = (newType === 'commission' || newType === 'salary') ? newAmount : -newAmount;

    const totalAdjustment = oldChange + newChange;

    setEmployeeTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    
    setEmployees(prev => prev.map(e => {
        if (e.id === oldTrans.employeeId) {
            return { ...e, balance: e.balance + totalAdjustment };
        }
        return e;
    }));
  };

  const deleteEmployeeTransaction = (id: string) => {
    const trans = employeeTransactions.find(t => t.id === id);
    if (!trans) return;

    const revertChange = (trans.type === 'commission' || trans.type === 'salary') ? -trans.amount : trans.amount;

    setEmployeeTransactions(prev => prev.filter(t => t.id !== id));
    
    setEmployees(prev => prev.map(e => {
        if (e.id === trans.employeeId) {
            return { ...e, balance: e.balance + revertChange };
        }
        return e;
    }));
  };

  // --- FINANCE ACTIONS ---
  const addFinancialTransaction = (trans: FinancialTransaction) => {
    setFinancialTransactions(prev => [trans, ...prev]);
  };

  const updateFinancialTransaction = (id: number, updates: Partial<FinancialTransaction>) => {
    setFinancialTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteFinancialTransaction = (id: number) => {
    setFinancialTransactions(prev => prev.filter(t => t.id !== id));
  };

  const createCampaign = (campaign: MarketingCampaign) => setCampaigns(prev => [campaign, ...prev]);
  const getWhatsappLink = (phone: string, message: string) => `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

  // --- GAMIFICATION ACTIONS ---
  
  const updateTierConfig = (tiers: TierConfig[]) => {
    updateCompanySettings({
      ...companySettings,
      gamification: {
        ...companySettings.gamification,
        tiers
      }
    });
  };

  const addPointsToClient = (clientId: string, workOrderId: string, points: number, description: string) => {
    setClientPoints(prev => {
      const existing = prev.find(cp => cp.clientId === clientId);
      if (existing) {
        const newTotal = existing.totalPoints + points;
        
        // Use dynamic tiers from config
        const tiers = companySettings.gamification.tiers || defaultTiers;
        // Sort tiers by points descending to find the highest matching tier
        const sortedTiers = [...tiers].sort((a, b) => b.minPoints - a.minPoints);
        const currentTierConfig = sortedTiers.find(t => newTotal >= t.minPoints) || tiers[0];
        
        // Map tier config to level index (1-based)
        const currentLevel = tiers.findIndex(t => t.id === currentTierConfig.id) + 1;

        return prev.map(cp => cp.clientId === clientId ? {
          ...cp, 
          totalPoints: newTotal,
          currentLevel: currentLevel,
          tier: currentTierConfig.id,
          servicesCompleted: cp.servicesCompleted + 1,
          lastServiceDate: formatISO(new Date()),
          pointsHistory: [...cp.pointsHistory, { id: `p-${Date.now()}`, workOrderId, points, description, date: formatISO(new Date()) }]
        } : cp);
      }
      return prev;
    });
  };

  const getClientPoints = (clientId: string): ClientPoints | undefined => clientPoints.find(cp => cp.clientId === clientId);

  const createFidelityCard = (clientId: string): FidelityCard => {
    const client = clients.find(c => c.id === clientId);
    const points = clientPoints.find(cp => cp.clientId === clientId);
    const tierColors: Record<string, 'blue' | 'purple' | 'emerald' | 'amber'> = { bronze: 'blue', silver: 'emerald', gold: 'amber', platinum: 'purple' };
    const card: FidelityCard = {
      clientId,
      cardNumber: `CC${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      cardHolder: client?.name || '',
      cardColor: tierColors[points?.tier || 'bronze'],
      qrCode: `https://qrcode.example.com/${clientId}`,
      issueDate: formatISO(new Date()),
      expiresAt: formatISO(addDays(new Date(), 365))
    };
    setFidelityCards(prev => [...prev, card]);
    return card;
  };

  const getFidelityCard = (clientId: string): FidelityCard | undefined => fidelityCards.find(c => c.clientId === clientId);

  // --- REWARDS ACTIONS ---
  const addReward = (reward: Omit<Reward, 'id' | 'createdAt'>) => {
    const newReward: Reward = {
      ...reward,
      id: `r-${Date.now()}`,
      createdAt: formatISO(new Date())
    };
    setRewards(prev => [...prev, newReward]);
  };

  const updateReward = (id: string, updates: Partial<Reward>) => {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteReward = (id: string) => {
    setRewards(prev => prev.filter(r => r.id !== id));
  };

  const getRewardsByLevel = (level: TierLevel): Reward[] => {
    return rewards.filter(r => r.active && r.requiredLevel === level);
  };

  // --- TIER MANAGEMENT ---
  const updateTier = (tier: TierLevel, updates: any) => {
    updateCompanySettings({
      ...companySettings,
      gamification: {
        ...companySettings.gamification,
        tiers: (companySettings.gamification?.tiers || []).map(t => 
          t.id === tier ? { ...t, ...updates } : t
        )
      }
    });
  };

  // --- PKPass & Google Wallet Generation ---
  const generatePKPass = (clientId: string): string => {
    const card = getFidelityCard(clientId);
    const points = getClientPoints(clientId);
    if (!card || !points) return '';
    
    const cardData = `
CARTÃO DE FIDELIDADE - CRISTAL CARE
=====================================
Nome: ${card.cardHolder}
Número: ${card.cardNumber}
Pontos: ${points.totalPoints}
Nível: ${points.tier.toUpperCase()}
Serviços: ${points.servicesCompleted}
Data Emissão: ${new Date().toLocaleDateString('pt-BR')}

Escaneie o QR CODE abaixo no ponto de venda:
${card.qrCode}
    `;
    
    return `data:text/plain;base64,${btoa(cardData)}`;
  };

  const generateGoogleWallet = (clientId: string): string => {
    // Retorna um URL de compartilhamento direto do cartão
    const baseUrl = window.location.origin;
    return `${baseUrl}/client-profile/${clientId}`;
  };
  
  // --- REDEMPTION SYSTEM (VOUCHERS) ---
  const claimReward = (clientId: string, rewardId: string): { success: boolean; message: string; voucherCode?: string } => {
    const reward = rewards.find(r => r.id === rewardId);
    const clientPoints = getClientPoints(clientId);
    
    if (!reward || !clientPoints) return { success: false, message: 'Recompensa ou cliente não encontrado' };
    if (clientPoints.totalPoints < reward.requiredPoints) {
      return { success: false, message: `Pontos insuficientes. Você tem ${clientPoints.totalPoints}, precisa de ${reward.requiredPoints}` };
    }
    
    // Generate Voucher Code
    const voucherCode = `DESC-${Math.floor(Math.random() * 10000)}-${reward.name.substring(0, 3).toUpperCase()}`;

    // Create Redemption Record
    const newRedemption: Redemption = {
      id: `red-${Date.now()}`,
      clientId,
      rewardId,
      rewardName: reward.name,
      code: voucherCode,
      pointsCost: reward.requiredPoints,
      status: 'active',
      redeemedAt: new Date().toISOString()
    };

    setRedemptions(prev => [...prev, newRedemption]);

    // Deduct Points
    setClientPoints(prev => prev.map(cp => 
      cp.clientId === clientId 
        ? {
            ...cp,
            totalPoints: cp.totalPoints - reward.requiredPoints,
            pointsHistory: [
              ...cp.pointsHistory,
              {
                id: `claim-${Date.now()}`,
                workOrderId: '',
                points: -reward.requiredPoints,
                description: `✅ Resgate: ${reward.name} (Voucher: ${voucherCode})`,
                date: new Date().toISOString()
              }
            ]
          }
        : cp
    ));
    
    // Update Reward Stats
    updateReward(rewardId, { redeemedCount: (reward.redeemedCount || 0) + 1 });
    
    return { success: true, message: `✅ Recompensa resgatada! Seu código é: ${voucherCode}`, voucherCode };
  };

  const getClientRedemptions = (clientId: string) => redemptions.filter(r => r.clientId === clientId);

  const useVoucher = (code: string, workOrderId: string): boolean => {
    const redemption = redemptions.find(r => r.code === code && r.status === 'active');
    if (!redemption) return false;

    setRedemptions(prev => prev.map(r => r.id === redemption.id ? { ...r, status: 'used', usedAt: new Date().toISOString(), usedInWorkOrderId: workOrderId } : r));
    return true;
  };

  const getVoucherDetails = (code: string) => {
    const redemption = redemptions.find(r => r.code === code);
    if (!redemption) return null;
    const reward = rewards.find(r => r.id === redemption.rewardId);
    return { redemption, reward };
  };

  return (
    <AppContext.Provider value={{ 
      inventory, workOrders, clients, recipes, reminders, services, priceMatrix, theme,
      employees, employeeTransactions, currentUser, ownerUser, campaigns, clientPoints, fidelityCards, rewards, redemptions,
      companySettings, subscription, updateCompanySettings,
      financialTransactions,
      login, logout,
      loginOwner, registerOwner, logoutOwner,
      addWorkOrder, updateWorkOrder, completeWorkOrder, submitNPS,
      addClient, updateClient, addVehicle,
      addInventoryItem, updateInventoryItem, deleteInventoryItem, deductStock,
      toggleTheme, generateReminders,
      updatePrice, updateServiceInterval, bulkUpdatePrices, getPrice, addService, updateService, deleteService,
      assignTask, startTask, stopTask, addEmployeeTransaction, updateEmployeeTransaction, deleteEmployeeTransaction,
      addEmployee, updateEmployee, deleteEmployee,
      addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction,
      createCampaign, getWhatsappLink,
      connectWhatsapp, disconnectWhatsapp,
      addPointsToClient, getClientPoints, createFidelityCard, getFidelityCard,
      addReward, updateReward, deleteReward, getRewardsByLevel,
      updateTier, updateTierConfig, generatePKPass, generateGoogleWallet, claimReward, getClientRedemptions, useVoucher, getVoucherDetails,
      notifications, markNotificationAsRead,
      updateServiceConsumption, getServiceConsumption, calculateServiceCost, serviceConsumptions
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
