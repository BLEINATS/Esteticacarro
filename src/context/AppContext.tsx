import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Client, InventoryItem, WorkOrder, ServiceRecipe, Reminder, Vehicle, 
  ServiceCatalogItem, PriceMatrixEntry, VehicleSize, Employee, Task, 
  TimeLog, EmployeeTransaction, MarketingCampaign, ClientSegment,
  CompanySettings, SubscriptionDetails, FinancialTransaction
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
  financialTransactions: FinancialTransaction[]; // NOVO
  currentUser: Employee | null;
  theme: 'light' | 'dark';
  campaigns: MarketingCampaign[];
  
  // SaaS & Config
  companySettings: CompanySettings;
  subscription: SubscriptionDetails;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  
  // WhatsApp Actions
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
  
  // Inventory Actions
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'status'>) => void;
  updateInventoryItem: (id: number, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: number) => void;
  deductStock: (serviceName: string) => void;
  
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

  // Finance Actions (NOVO)
  addFinancialTransaction: (trans: FinancialTransaction) => void;
  updateFinancialTransaction: (id: number, updates: Partial<FinancialTransaction>) => void;
  deleteFinancialTransaction: (id: number) => void;

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
  responsibleName: 'Anderson Silva',
  cnpj: '12.345.678/0001-90',
  email: 'contato@cristalcare.com.br',
  phone: '(11) 99999-8888',
  address: 'Av. Automotiva, 1000 - Jardins, SP',
  logoUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=150&q=80',
  website: 'www.cristalcare.com.br',
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
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
    vehicles: [{ id: 'v1', model: 'Porsche Macan', plate: 'POR-9111', color: 'Cinza Nardo', year: '2023', size: 'large' }],
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
    { 
      id: 'srv2', 
      name: 'Polimento Comercial', 
      description: 'Revitalização do brilho e remoção de riscos superficiais e marcas de lavagem (swirls).', 
      category: 'Polimento', 
      active: true, 
      standardTimeMinutes: 240, 
      returnIntervalDays: 180, 
      imageUrl: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=800&q=80' 
    },
    { 
      id: 'srv3', 
      name: 'Vitrificação 3 Anos', 
      description: 'Proteção cerâmica de alta dureza (9H) que repele água e sujeira, facilitando a limpeza.', 
      category: 'Proteção', 
      active: true, 
      standardTimeMinutes: 480, 
      returnIntervalDays: 365, 
      imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80' 
    },
    { 
      id: 'srv4', 
      name: 'Higienização Interna', 
      description: 'Limpeza profunda de bancos, carpetes e teto com extração de sujeira e eliminação de ácaros.', 
      category: 'Interior', 
      active: true, 
      standardTimeMinutes: 300, 
      returnIntervalDays: 180, 
      imageUrl: 'https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&w=800&q=80' 
    },
    { 
      id: 'srv5', 
      name: 'Martelinho de Ouro', 
      description: 'Técnica artesanal para desamassar a lataria sem danificar a pintura original.', 
      category: 'Funilaria', 
      active: true, 
      standardTimeMinutes: 120, 
      returnIntervalDays: 0, 
      imageUrl: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&w=800&q=80' 
    },
    { 
      id: 'srv6', 
      name: 'Cristalização de Vidros', 
      description: 'Tratamento repelente de chuva que melhora a visibilidade em dias chuvosos.', 
      category: 'Proteção', 
      active: true, 
      standardTimeMinutes: 60, 
      returnIntervalDays: 90, 
      imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80' 
    },
    { 
      id: 'srv7', 
      name: 'Oxi-Sanitização', 
      description: 'Esterilização do ar condicionado e interior com ozônio, eliminando odores e bactérias.', 
      category: 'Interior', 
      active: true, 
      standardTimeMinutes: 45, 
      returnIntervalDays: 90, 
      imageUrl: 'https://images.unsplash.com/photo-1600661653561-629509216228?auto=format&fit=crop&w=800&q=80' 
    },
    { 
      id: 'srv8', 
      name: 'PPF (Frontal)', 
      description: 'Película de proteção de pintura contra pedras e riscos profundos em estradas.', 
      category: 'Proteção', 
      active: true, 
      standardTimeMinutes: 600, 
      returnIntervalDays: 0, 
      imageUrl: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=80' 
    },
    { 
      id: 'srv9', 
      name: 'Detalhamento de Motor', 
      description: 'Limpeza técnica do cofre do motor com proteção de plásticos e borrachas.', 
      category: 'Lavagem', 
      active: true, 
      standardTimeMinutes: 120, 
      returnIntervalDays: 180, 
      imageUrl: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=800&q=80' 
    }
];

const initialPriceMatrix: PriceMatrixEntry[] = initialServices.flatMap(service => {
  return (['small', 'medium', 'large', 'xl'] as VehicleSize[]).map(size => {
    let basePrice = 100;
    if (service.category === 'Lavagem') basePrice = 80;
    if (service.category === 'Polimento') basePrice = 450;
    if (service.category === 'Proteção') basePrice = 900;
    if (service.category === 'Interior') basePrice = 300;
    if (service.category === 'Funilaria') basePrice = 600;
    
    const multipliers: Record<string, number> = { small: 1, medium: 1.2, large: 1.4, xl: 1.7 };
    
    return {
      serviceId: service.id,
      size: size,
      price: Math.ceil(basePrice * multipliers[size])
    };
  });
});

const initialInventory: InventoryItem[] = [
    { id: 1, name: 'Shampoo Neutro', category: 'Lavagem', stock: 50, unit: 'L', minStock: 20, status: 'ok', costPrice: 15.00 },
    { id: 2, name: 'Desengraxante', category: 'Lavagem', stock: 15, unit: 'L', minStock: 10, status: 'ok', costPrice: 22.50 },
    { id: 3, name: 'Cera de Carnaúba', category: 'Acabamento', stock: 5, unit: 'un', minStock: 8, status: 'warning', costPrice: 89.90 },
    { id: 4, name: 'Composto Polidor Corte', category: 'Polimento', stock: 2, unit: 'un', minStock: 5, status: 'critical', costPrice: 120.00 },
    { id: 5, name: 'Composto Polidor Refino', category: 'Polimento', stock: 4, unit: 'un', minStock: 5, status: 'warning', costPrice: 120.00 },
    { id: 6, name: 'Verniz Alto Sólidos', category: 'Funilaria', stock: 3, unit: 'L', minStock: 10, status: 'critical', costPrice: 250.00 },
    { id: 7, name: 'Lixa d\'água 1200', category: 'Funilaria', stock: 100, unit: 'un', minStock: 50, status: 'ok', costPrice: 2.50 },
    { id: 8, name: 'APC Flotador', category: 'Interior', stock: 20, unit: 'L', minStock: 15, status: 'ok', costPrice: 18.00 },
    { id: 9, name: 'Vitrificador 9H', category: 'Proteção', stock: 8, unit: 'un', minStock: 3, status: 'ok', costPrice: 350.00 },
    { id: 10, name: 'Pincel Detalhamento', category: 'Acessórios', stock: 12, unit: 'un', minStock: 10, status: 'ok', costPrice: 15.00 }
];

const initialWorkOrders: WorkOrder[] = [];
const initialEmployeeTransactions: EmployeeTransaction[] = [];
const initialCampaigns: MarketingCampaign[] = [];

const initialFinancialTransactions: FinancialTransaction[] = [
  { id: 1, desc: 'Pagamento OS #4092 - BMW X5', category: 'Serviços', amount: 2500.00, netAmount: 2375.00, fee: 125.00, type: 'income', date: '2024-03-14', dueDate: '2024-03-14', method: 'Cartão Crédito (3x)', installments: 3, status: 'paid' },
  { id: 2, desc: 'Compra de Insumos - Polimento', category: 'Estoque', amount: -450.00, netAmount: -450.00, fee: 0, type: 'expense', date: '2024-03-14', dueDate: '2024-03-14', method: 'Boleto', status: 'paid' },
  { id: 3, desc: 'Aluguel do Galpão', category: 'Aluguel/Fixo', amount: -5000.00, netAmount: -5000.00, fee: 0, type: 'expense', date: '2024-03-01', dueDate: '2024-03-20', method: 'Transferência', status: 'pending' },
  { id: 4, desc: 'Fatura Fornecedor Tintas', category: 'Estoque', amount: -1200.00, netAmount: -1200.00, fee: 0, type: 'expense', date: '2024-03-10', dueDate: '2024-03-10', method: 'Boleto', status: 'paid' },
  { id: 5, desc: 'OS #4100 - Mercedes C180 (Faturado)', category: 'Serviços', amount: 3500.00, netAmount: 3500.00, fee: 0, type: 'income', date: '2024-03-15', dueDate: '2024-03-30', method: 'Boleto', status: 'pending' },
  { id: 6, desc: 'Manutenção Compressores', category: 'Manutenção', amount: -890.00, netAmount: -890.00, fee: 0, type: 'expense', date: '2024-03-05', dueDate: '2024-03-05', method: 'Cartão Débito', status: 'paid' },
];


export function AppProvider({ children }: { children: ReactNode }) {
  // State Initialization
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => getStorage('companySettings_v12', initialCompanySettings)); 
  const [subscription, setSubscription] = useState<SubscriptionDetails>(() => getStorage('subscription_v1', initialSubscription));
  
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getStorage('inventory_v8', initialInventory)); 
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => getStorage<WorkOrder[]>('workOrders_v7', initialWorkOrders));
  const [clients, setClients] = useState<Client[]>(() => getStorage<Client[]>('clients_v7', initialClients));
  const [reminders, setReminders] = useState<Reminder[]>(() => getStorage('reminders_v7', initialReminders));
  
  const [services, setServices] = useState<ServiceCatalogItem[]>(() => getStorage('services_v10', initialServices));
  const [priceMatrix, setPriceMatrix] = useState<PriceMatrixEntry[]>(() => getStorage('priceMatrix_v8', initialPriceMatrix));
  
  const [employees, setEmployees] = useState<Employee[]>(() => getStorage('employees_v8', initialEmployees)); 
  const [employeeTransactions, setEmployeeTransactions] = useState<EmployeeTransaction[]>(() => getStorage('employeeTransactions_v7', initialEmployeeTransactions));
  // FIXED: Updated version key to force clean state for finance
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>(() => getStorage('financialTransactions_v2', initialFinancialTransactions));

  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(() => getStorage<MarketingCampaign[]>('campaigns_v7', initialCampaigns));
  
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getStorage('theme', 'dark'));
  const [recipes] = useState<ServiceRecipe[]>([]);

  // Persistence
  useEffect(() => setStorage('companySettings_v12', companySettings), [companySettings]);
  useEffect(() => setStorage('subscription_v1', subscription), [subscription]);
  useEffect(() => setStorage('theme', theme), [theme]);
  useEffect(() => setStorage('reminders_v7', reminders), [reminders]); 
  useEffect(() => setStorage('services_v10', services), [services]);
  useEffect(() => setStorage('priceMatrix_v8', priceMatrix), [priceMatrix]); 
  useEffect(() => setStorage('inventory_v8', inventory), [inventory]);
  useEffect(() => setStorage('employees_v8', employees), [employees]); 
  useEffect(() => setStorage('employeeTransactions_v7', employeeTransactions), [employeeTransactions]);
  // FIXED: Updated version key
  useEffect(() => setStorage('financialTransactions_v2', financialTransactions), [financialTransactions]);

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
  const login = (pin: string) => {
    const user = employees.find(e => e.pin === pin);
    if (user) { setCurrentUser(user); return true; }
    return false;
  };
  const logout = () => setCurrentUser(null);

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

  const deductStock = (serviceName: string) => {
    console.log(`Deducting stock for service: ${serviceName}`);
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
        updateWorkOrder(id, { status: 'Concluído' });
        generateReminders(os); 
        deductStock(os.service); 
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

  return (
    <AppContext.Provider value={{ 
      inventory, workOrders, clients, recipes, reminders, services, priceMatrix, theme,
      employees, employeeTransactions, currentUser, campaigns,
      companySettings, subscription, updateCompanySettings,
      financialTransactions, // EXPORTED
      login, logout,
      addWorkOrder, updateWorkOrder, completeWorkOrder, submitNPS,
      addClient, updateClient, addVehicle,
      addInventoryItem, updateInventoryItem, deleteInventoryItem, deductStock,
      toggleTheme, generateReminders,
      updatePrice, updateServiceInterval, bulkUpdatePrices, getPrice, addService, updateService, deleteService,
      assignTask, startTask, stopTask, addEmployeeTransaction, updateEmployeeTransaction, deleteEmployeeTransaction,
      addEmployee, updateEmployee, deleteEmployee,
      addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction, // EXPORTED
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
