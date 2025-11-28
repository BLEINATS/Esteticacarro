import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Client, InventoryItem, WorkOrder, ServiceRecipe, Reminder, Vehicle, 
  ServiceCatalogItem, PriceMatrixEntry, VehicleSize, Employee, Task, 
  TimeLog, EmployeeTransaction, MarketingCampaign, ClientSegment,
  CompanySettings, SubscriptionDetails
} from '../types';
import { differenceInDays, addDays, subDays, formatISO, startOfWeek, addHours } from 'date-fns';

// ... (Interfaces remain the same) ...
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
  currentUser: Employee | null;
  theme: 'light' | 'dark';
  campaigns: MarketingCampaign[];
  
  // SaaS & Config
  companySettings: CompanySettings;
  subscription: SubscriptionDetails;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  
  // WhatsApp Actions (New)
  connectWhatsapp: () => void;
  disconnectWhatsapp: () => void;
  
  // Actions
  login: (pin: string) => boolean;
  logout: () => void;
  
  addWorkOrder: (os: WorkOrder) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  completeWorkOrder: (id: string) => void;
  submitNPS: (workOrderId: string, score: number, comment?: string) => void;
  
  addClient: (client: Partial<Client>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  addVehicle: (clientId: string, vehicle: Vehicle) => void;
  
  deductStock: (serviceName: string) => void;
  toggleTheme: () => void;
  generateReminders: (os: WorkOrder) => void;
  
  // Service & Pricing Actions
  addService: (service: Partial<ServiceCatalogItem>) => void;
  updateService: (id: string, updates: Partial<ServiceCatalogItem>) => void;
  updatePrice: (serviceId: string, size: VehicleSize, newPrice: number) => void;
  updateServiceInterval: (serviceId: string, days: number) => void;
  bulkUpdatePrices: (targetSize: VehicleSize | 'all', percentage: number) => void;
  getPrice: (serviceId: string, size: VehicleSize) => number;

  // HR Actions
  assignTask: (workOrderId: string, serviceId: string, employeeId: string) => void;
  startTask: (taskId: string) => void;
  stopTask: (taskId: string) => void;
  addEmployeeTransaction: (trans: EmployeeTransaction) => void;

  // Marketing Actions
  createCampaign: (campaign: MarketingCampaign) => void;
  getWhatsappLink: (phone: string, message: string) => string;
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

// --- MOCK DATA ---

const initialCompanySettings: CompanySettings = {
  name: 'Cristal Care Autodetail',
  responsibleName: 'Anderson Silva', // NOVO CAMPO
  cnpj: '12.345.678/0001-90',
  email: 'contato@cristalcare.com.br',
  phone: '(11) 99999-8888',
  address: 'Av. Automotiva, 1000 - Jardins, SP',
  logoUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=150&q=80',
  website: 'www.cristalcare.com.br',
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

// ... (Rest of mock data remains the same) ...
const today = new Date();
const yesterday = subDays(today, 1);
const initialClients: Client[] = [
  { 
    id: 'c1', name: 'Dr. Roberto Silva', phone: '11999998888', email: 'roberto.med@email.com', notes: 'Cliente VIP. Exigente com acabamento interno.',
    vehicles: [{ id: 'v1', model: 'Porsche Macan', plate: 'POR-9111', color: 'Cinza Nardo', year: '2023', size: 'large' }],
    ltv: 15500.00, lastVisit: formatISO(yesterday), visitCount: 12, status: 'active', segment: 'vip'
  },
];
const initialReminders: Reminder[] = []; 
const initialEmployees: Employee[] = [
  { id: 'e1', name: 'Mestre Miyagi', role: 'Funileiro', pin: '1234', commissionRate: 30, commissionBase: 'net', active: true, balance: 3450.00 },
  { id: 'e5', name: 'Fernanda Gerente', role: 'Manager', pin: '9999', commissionRate: 5, commissionBase: 'gross', active: true, balance: 4500.00 },
];
const initialServices: ServiceCatalogItem[] = [
    { id: 'srv1', name: 'Lavagem Técnica', description: '...', category: 'Lavagem', active: true, standardTimeMinutes: 90, returnIntervalDays: 30 },
];
const initialPriceMatrix: PriceMatrixEntry[] = [];
const initialInventory: InventoryItem[] = [];
const initialWorkOrders: WorkOrder[] = [];
const initialTransactions: EmployeeTransaction[] = [];
const initialCampaigns: MarketingCampaign[] = [];


export function AppProvider({ children }: { children: ReactNode }) {
  // State Initialization
  // BUMPED TO V6 to ensure clean config state for new logic
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => getStorage('companySettings_v6', initialCompanySettings)); 
  const [subscription, setSubscription] = useState<SubscriptionDetails>(() => getStorage('subscription_v1', initialSubscription));
  
  // Existing States
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getStorage('inventory_v7', initialInventory));
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => getStorage<WorkOrder[]>('workOrders_v7', initialWorkOrders));
  const [clients, setClients] = useState<Client[]>(() => getStorage<Client[]>('clients_v7', initialClients));
  const [reminders, setReminders] = useState<Reminder[]>(() => getStorage('reminders_v7', initialReminders));
  const [services, setServices] = useState<ServiceCatalogItem[]>(() => getStorage('services_v7', initialServices));
  const [priceMatrix, setPriceMatrix] = useState<PriceMatrixEntry[]>(() => getStorage('priceMatrix_v7', initialPriceMatrix));
  const [employees, setEmployees] = useState<Employee[]>(() => getStorage('employees_v7', initialEmployees));
  const [employeeTransactions, setEmployeeTransactions] = useState<EmployeeTransaction[]>(() => getStorage('employeeTransactions_v7', initialTransactions));
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(() => getStorage<MarketingCampaign[]>('campaigns_v7', initialCampaigns));
  
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getStorage('theme', 'dark'));
  const [recipes] = useState<ServiceRecipe[]>([]);

  // Persistence
  useEffect(() => setStorage('companySettings_v6', companySettings), [companySettings]);
  useEffect(() => setStorage('subscription_v1', subscription), [subscription]);
  useEffect(() => setStorage('theme', theme), [theme]);

  // RECOVERY LOGIC: If loaded in 'scanning' state, auto-connect (simulating completion)
  useEffect(() => {
    if (companySettings.whatsapp.session.status === 'scanning') {
      console.log("Recovering from scanning state...");
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
  }, []); // Runs once on mount

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const login = (pin: string) => {
    const user = employees.find(e => e.pin === pin);
    if (user) { setCurrentUser(user); return true; }
    return false;
  };
  const logout = () => setCurrentUser(null);

  // Actions
  const updateCompanySettings = (settings: Partial<CompanySettings>) => {
    setCompanySettings(prev => ({ ...prev, ...settings }));
  };

  // --- WHATSAPP SIMULATION ---
  const connectWhatsapp = () => {
    // 1. Set to Scanning
    setCompanySettings(prev => ({
      ...prev,
      whatsapp: {
        ...prev.whatsapp,
        session: { status: 'scanning' }
      }
    }));

    // 2. Simulate delay (User scanning QR)
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
    }, 4000); // 4 seconds to simulate scan
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

  // ... (Keeping all existing actions)
  const addWorkOrder = (os: WorkOrder) => setWorkOrders(prev => [os, ...prev]);
  const updateWorkOrder = (id: string, updates: Partial<WorkOrder>) => setWorkOrders(prev => prev.map(os => os.id === id ? { ...os, ...updates } : os));
  const addClient = (client: Partial<Client>) => setClients(prev => [...prev, { id: `c-${Date.now()}`, vehicles: [], ltv: 0, lastVisit: new Date().toISOString(), visitCount: 0, status: 'active', segment: 'new', name: '', phone: '', email: '', ...client } as Client]);
  const updateClient = (id: string, updates: Partial<Client>) => setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  const addVehicle = (clientId: string, vehicle: Vehicle) => setClients(prev => prev.map(c => c.id === clientId ? { ...c, vehicles: [...c.vehicles, vehicle] } : c));
  const deductStock = (serviceName: string) => { };
  const generateReminders = (os: WorkOrder) => { };
  const addService = (service: Partial<ServiceCatalogItem>) => {
    const newService = { id: `srv-${Date.now()}`, active: true, standardTimeMinutes: 60, returnIntervalDays: 0, ...service } as ServiceCatalogItem;
    setServices(prev => [...prev, newService]);
  };
  const updateService = (id: string, updates: Partial<ServiceCatalogItem>) => setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  const updatePrice = (serviceId: string, size: VehicleSize, newPrice: number) => setPriceMatrix(prev => { const exists = prev.find(p => p.serviceId === serviceId && p.size === size); return exists ? prev.map(p => p.serviceId === serviceId && p.size === size ? { ...p, price: newPrice } : p) : [...prev, { serviceId, size, price: newPrice }]; });
  const updateServiceInterval = (serviceId: string, days: number) => setServices(prev => prev.map(s => s.id === serviceId ? { ...s, returnIntervalDays: days } : s));
  const bulkUpdatePrices = (targetSize: VehicleSize | 'all', percentage: number) => { const factor = 1 + (percentage / 100); setPriceMatrix(prev => prev.map(entry => (targetSize === 'all' || entry.size === targetSize) ? { ...entry, price: Math.ceil(entry.price * factor) } : entry)); };
  const getPrice = (serviceId: string, size: VehicleSize) => priceMatrix.find(p => p.serviceId === serviceId && p.size === size)?.price || 0;
  const assignTask = () => {}; const startTask = () => {}; const stopTask = () => {};
  const completeWorkOrder = (id: string) => {
      updateWorkOrder(id, { status: 'Concluído' });
  };
  const submitNPS = (workOrderId: string, score: number, comment?: string) => updateWorkOrder(workOrderId, { npsScore: score, npsComment: comment });
  const addEmployeeTransaction = (trans: EmployeeTransaction) => { setEmployeeTransactions(prev => [...prev, trans]); setEmployees(prev => prev.map(e => { if (e.id === trans.employeeId) { const change = trans.type === 'commission' ? trans.amount : -trans.amount; return { ...e, balance: e.balance + change }; } return e; })); };
  const createCampaign = (campaign: MarketingCampaign) => setCampaigns(prev => [campaign, ...prev]);
  const getWhatsappLink = (phone: string, message: string) => `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

  return (
    <AppContext.Provider value={{ 
      inventory, workOrders, clients, recipes, reminders, services, priceMatrix, theme,
      employees, employeeTransactions, currentUser, campaigns,
      companySettings, subscription, updateCompanySettings,
      login, logout,
      addWorkOrder, updateWorkOrder, completeWorkOrder, submitNPS,
      addClient, updateClient, addVehicle,
      deductStock, toggleTheme, generateReminders,
      updatePrice, updateServiceInterval, bulkUpdatePrices, getPrice, addService, updateService,
      assignTask, startTask, stopTask, addEmployeeTransaction,
      createCampaign, getWhatsappLink,
      connectWhatsapp, disconnectWhatsapp
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
