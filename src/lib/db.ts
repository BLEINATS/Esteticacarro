import { 
  MOCK_CLIENTS, MOCK_EMPLOYEES, MOCK_FINANCIALS, 
  MOCK_INVENTORY, MOCK_SERVICES, MOCK_TENANT, 
  MOCK_USER, MOCK_WORK_ORDERS, MOCK_ALERTS 
} from './mockData';

const DB_KEY = 'cristal_care_local_db_v1';

// Tipos genéricos para o banco
type CollectionName = 
  | 'clients' 
  | 'work_orders' 
  | 'inventory' 
  | 'services' 
  | 'employees' 
  | 'financial_transactions' 
  | 'users' 
  | 'tenants'
  | 'marketing_campaigns'
  | 'rewards'
  | 'redemptions'
  | 'fidelity_cards'
  | 'points_history'
  | 'alerts';

interface DatabaseSchema {
  clients: any[];
  work_orders: any[];
  inventory: any[];
  services: any[];
  employees: any[];
  financial_transactions: any[];
  users: any[];
  tenants: any[];
  marketing_campaigns: any[];
  rewards: any[];
  redemptions: any[];
  fidelity_cards: any[];
  points_history: any[];
  alerts: any[];
}

// Inicializa o banco se não existir
const initializeDB = () => {
  const existing = localStorage.getItem(DB_KEY);
  if (!existing) {
    const initialData: DatabaseSchema = {
      clients: MOCK_CLIENTS,
      work_orders: MOCK_WORK_ORDERS,
      inventory: MOCK_INVENTORY,
      services: MOCK_SERVICES,
      employees: MOCK_EMPLOYEES,
      financial_transactions: MOCK_FINANCIALS,
      users: [MOCK_USER],
      tenants: [MOCK_TENANT],
      marketing_campaigns: [],
      rewards: [],
      redemptions: [],
      fidelity_cards: [],
      points_history: [],
      alerts: MOCK_ALERTS
    };
    localStorage.setItem(DB_KEY, JSON.stringify(initialData));
    console.log('Database initialized with mock data');
  }
};

// Helper para simular delay de rede
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para ler o banco
const getDB = (): DatabaseSchema => {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : {};
};

// Helper para salvar o banco
const saveDB = (data: DatabaseSchema) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

// Serviço CRUD Genérico
export const db = {
  init: initializeDB,

  getAll: async <T>(collection: CollectionName): Promise<T[]> => {
    await delay();
    const db = getDB();
    return (db[collection] || []) as T[];
  },

  getById: async <T>(collection: CollectionName, id: string | number): Promise<T | null> => {
    await delay();
    const db = getDB();
    const item = db[collection]?.find((i: any) => i.id === id);
    return item || null;
  },

  create: async <T>(collection: CollectionName, item: T): Promise<T> => {
    await delay();
    const db = getDB();
    // Gera ID se não existir
    const newItem = { 
      id: (item as any).id || (typeof item === 'object' && 'id' in (item as any) ? (item as any).id : Date.now().toString()),
      ...item,
      created_at: new Date().toISOString()
    };
    
    // Garante que a coleção existe
    if (!db[collection]) db[collection] = [];
    
    db[collection] = [newItem, ...db[collection]];
    saveDB(db);
    return newItem;
  },

  update: async <T>(collection: CollectionName, id: string | number, updates: Partial<T>): Promise<T | null> => {
    await delay();
    const db = getDB();
    const index = db[collection]?.findIndex((i: any) => i.id === id);
    
    if (index !== undefined && index >= 0) {
      const updatedItem = { ...db[collection][index], ...updates };
      db[collection][index] = updatedItem;
      saveDB(db);
      return updatedItem;
    }
    return null;
  },

  delete: async (collection: CollectionName, id: string | number): Promise<boolean> => {
    await delay();
    const db = getDB();
    const initialLength = db[collection]?.length || 0;
    db[collection] = db[collection]?.filter((i: any) => i.id !== id) || [];
    saveDB(db);
    return db[collection].length < initialLength;
  },

  // Auth Helpers
  findUserByEmail: async (email: string) => {
    await delay();
    const db = getDB();
    return db.users.find((u: any) => u.email === email);
  }
};
