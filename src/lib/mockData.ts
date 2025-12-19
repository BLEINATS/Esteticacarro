import { 
  Client, InventoryItem, WorkOrder, ServiceCatalogItem, 
  Employee, FinancialTransaction, Vehicle, CompanySettings, SystemAlert
} from '../types';

export const MOCK_USER = {
  id: 'user-123',
  name: 'Admin Cristal Care',
  email: 'admin@cristalcare.com',
  password: '123', // Senha simples para testes
  shopName: 'Cristal Care Autodetail'
};

export const MOCK_TENANT = {
  id: 'tenant-1',
  name: 'Cristal Care Autodetail',
  slug: 'cristal-care',
  owner_id: MOCK_USER.id,
  plan_id: 'pro',
  status: 'active',
  created_at: new Date().toISOString()
};

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Roberto Silva',
    phone: '(11) 99999-1111',
    email: 'roberto@email.com',
    vehicles: [
      { id: 'v1', model: 'BMW 320i', plate: 'ABC-1234', color: 'Preto', year: '2023', size: 'medium' }
    ],
    ltv: 1500,
    visitCount: 3,
    lastVisit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 dias atrás
    status: 'active',
    segment: 'vip',
    address: 'Rua das Flores, 123 - SP'
  },
  {
    id: 'c2',
    name: 'Ana Souza',
    phone: '(11) 98888-2222',
    email: 'ana@email.com',
    vehicles: [
      { id: 'v2', model: 'Jeep Compass', plate: 'XYZ-9876', color: 'Branco', year: '2022', size: 'large' }
    ],
    ltv: 350,
    visitCount: 1,
    lastVisit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 dias atrás
    status: 'active',
    segment: 'new',
    address: 'Av. Paulista, 1000 - SP'
  },
  {
    id: 'c3',
    name: 'Carlos Oliveira',
    phone: '(11) 97777-3333',
    email: 'carlos@email.com',
    vehicles: [
      { id: 'v3', model: 'Honda Civic', plate: 'DEF-5678', color: 'Prata', year: '2021', size: 'medium' }
    ],
    ltv: 2200,
    visitCount: 8,
    lastVisit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 70).toISOString(), // 70 dias atrás (Risco)
    status: 'churn_risk',
    segment: 'recurring',
    address: 'Rua Augusta, 500 - SP'
  }
];

export const MOCK_SERVICES: ServiceCatalogItem[] = [
  {
    id: 's1',
    name: 'Lavagem Detalhada',
    category: 'Lavagem',
    description: 'Lavagem técnica com descontaminação e proteção.',
    standardTimeMinutes: 60,
    active: true,
    returnIntervalDays: 30,
    showOnLandingPage: true
  },
  {
    id: 's2',
    name: 'Polimento Técnico',
    category: 'Polimento',
    description: 'Correção de pintura em 3 etapas.',
    standardTimeMinutes: 240,
    active: true,
    returnIntervalDays: 180,
    showOnLandingPage: true
  },
  {
    id: 's3',
    name: 'Higienização Interna',
    category: 'Interior',
    description: 'Limpeza profunda de estofados e carpetes.',
    standardTimeMinutes: 180,
    active: true,
    returnIntervalDays: 90,
    showOnLandingPage: true
  },
  {
    id: 's4',
    name: 'Vitrificação Cerâmica',
    category: 'Proteção',
    description: 'Proteção de pintura por até 3 anos.',
    standardTimeMinutes: 300,
    active: true,
    returnIntervalDays: 365,
    showOnLandingPage: true
  }
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 1, name: 'Shampoo Neutro', category: 'Químicos', stock: 5, unit: 'L', minStock: 2, costPrice: 45.00, status: 'ok' },
  { id: 2, name: 'Cera de Carnaúba', category: 'Acabamento', stock: 1, unit: 'un', minStock: 2, costPrice: 120.00, status: 'critical' },
  { id: 3, name: 'APC Multiuso', category: 'Químicos', stock: 10, unit: 'L', minStock: 5, costPrice: 35.00, status: 'ok' },
  { id: 4, name: 'Pano Microfibra', category: 'Acessórios', stock: 15, unit: 'un', minStock: 20, costPrice: 8.00, status: 'warning' }
];

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'e1',
    name: 'João Técnico',
    role: 'Detailer',
    pin: '1234',
    salaryType: 'commission',
    fixedSalary: 0,
    commissionRate: 30,
    commissionBase: 'gross',
    active: true,
    balance: 450.00
  },
  {
    id: 'e2',
    name: 'Maria Gerente',
    role: 'Manager',
    pin: '9999',
    salaryType: 'fixed',
    fixedSalary: 2500,
    commissionRate: 0,
    commissionBase: 'net',
    active: true,
    balance: 0
  }
];

export const MOCK_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'OS-1001',
    clientId: 'c1',
    vehicle: 'BMW 320i',
    plate: 'ABC-1234',
    service: 'Lavagem Detalhada',
    serviceId: 's1',
    serviceIds: ['s1'],
    status: 'Concluído',
    technician: 'João Técnico',
    deadline: 'Ontem',
    priority: 'medium',
    totalValue: 150.00,
    damages: [],
    vehicleInventory: { estepe: true, macaco: true, chaveRoda: true, tapetes: true, manual: true, antena: true, pertences: '' },
    dailyLog: [],
    qaChecklist: [],
    tasks: [],
    checklist: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Ontem
    paymentStatus: 'paid',
    paymentMethod: 'Pix',
    paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: 'OS-1002',
    clientId: 'c2',
    vehicle: 'Jeep Compass',
    plate: 'XYZ-9876',
    service: 'Polimento Técnico',
    serviceId: 's2',
    serviceIds: ['s2'],
    status: 'Em Andamento',
    technician: 'João Técnico',
    deadline: 'Hoje 18:00',
    priority: 'high',
    totalValue: 800.00,
    damages: [],
    vehicleInventory: { estepe: true, macaco: true, chaveRoda: true, tapetes: true, manual: true, antena: true, pertences: '' },
    dailyLog: [],
    qaChecklist: [],
    tasks: [],
    checklist: [],
    createdAt: new Date().toISOString(),
    paymentStatus: 'pending'
  }
];

export const MOCK_FINANCIALS: FinancialTransaction[] = [
  {
    id: 1,
    desc: 'Pagamento OS-1001',
    category: 'Serviços',
    amount: 150.00,
    netAmount: 150.00,
    fee: 0,
    type: 'income',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    method: 'Pix',
    status: 'paid'
  },
  {
    id: 2,
    desc: 'Compra de Produtos',
    category: 'Estoque',
    amount: -250.00,
    netAmount: -250.00,
    fee: 0,
    type: 'expense',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    method: 'Cartão Crédito',
    status: 'paid'
  }
];

export const MOCK_ALERTS: SystemAlert[] = [
  {
    id: 'alert-1',
    type: 'cliente',
    message: 'Anomalia: 3 Clientes VIP não retornam há mais de 60 dias. Risco de Churn.',
    level: 'critico',
    resolved: false,
    createdAt: new Date().toISOString(),
    financialImpact: 4500,
    actionLabel: 'Recuperar Clientes',
    actionLink: '/marketing'
  },
  {
    id: 'alert-2',
    type: 'estoque',
    message: 'Estoque Crítico: Cera de Carnaúba (1 un). Risco de parada na operação.',
    level: 'critico',
    resolved: false,
    createdAt: new Date().toISOString(),
    financialImpact: 800,
    actionLabel: 'Repor Estoque',
    actionLink: '/inventory'
  },
  {
    id: 'alert-3',
    type: 'agenda',
    message: 'Oportunidade: Agenda de Quinta-feira com 40% de ociosidade.',
    level: 'info',
    resolved: false,
    createdAt: new Date().toISOString(),
    financialImpact: 2000,
    actionLabel: 'Criar Promoção Relâmpago',
    actionLink: '/marketing'
  },
  {
    id: 'alert-4',
    type: 'financeiro',
    message: 'Alerta: Queda de 12% no ticket médio comparado à semana anterior.',
    level: 'atencao',
    resolved: false,
    createdAt: new Date().toISOString(),
    financialImpact: 1200,
    actionLabel: 'Ver Relatório',
    actionLink: '/finance'
  }
];
