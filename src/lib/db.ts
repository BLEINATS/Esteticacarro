import { 
  MOCK_CLIENTS, MOCK_EMPLOYEES, MOCK_FINANCIALS, 
  MOCK_INVENTORY, MOCK_SERVICES, MOCK_TENANT, 
  MOCK_USER, MOCK_WORK_ORDERS, MOCK_ALERTS, MOCK_REMINDERS, MOCK_REWARDS, MOCK_EMPLOYEE_TRANSACTIONS
} from './mockData';

const DB_NAME = 'cristal_care_idb';
// Increment version to force schema refresh if needed
const DB_VERSION = 5;
const LOCAL_STORAGE_KEY = 'cristal_care_local_db_v1';

const COLLECTIONS = [
  'clients', 
  'vehicles', 
  'work_orders', 
  'inventory', 
  'services', 
  'employees', 
  'employee_transactions',
  'financial_transactions', 
  'users', 
  'tenants',
  'marketing_campaigns', 
  'rewards', 
  'redemptions', 
  'fidelity_cards', 
  'points_history', 
  'alerts', 
  'reminders', 
  'message_logs',
  'support_tickets',
  'social_posts'
] as const;

type CollectionName = typeof COLLECTIONS[number];

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      COLLECTIONS.forEach(col => {
        if (!db.objectStoreNames.contains(col)) {
          db.createObjectStore(col, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbInitPromise;
};

const runTransaction = async <T>(
  storeName: CollectionName, 
  mode: IDBTransactionMode, 
  callback: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    
    let request: IDBRequest<T> | void;
    try {
      request = callback(store);
    } catch (e) {
      reject(e);
      return;
    }

    transaction.oncomplete = () => {
      if (request) resolve(request.result);
      else resolve(undefined as unknown as T);
    };

    transaction.onerror = () => reject(transaction.error);
  });
};

const initializeDB = async () => {
  try {
    await openDB();
    
    // MODO REAL: Não carregamos mais dados de exemplo (Mock Data).
    // O banco inicia vazio ou com os dados que já foram salvos anteriormente.
    
    // Se precisar forçar a limpeza de dados antigos de teste, descomente a linha abaixo uma vez:
    // await db.reset(true);

  } catch (error) {
    console.error("Failed to initialize DB:", error);
  }
};

export const db = {
  init: initializeDB,

  reset: async (skipSeeding = true) => {
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => {
      localStorage.clear();
      window.location.reload();
    };
  },

  getAll: async <T>(collection: CollectionName): Promise<T[]> => {
    return runTransaction<T[]>(collection, 'readonly', store => store.getAll());
  },

  getById: async <T>(collection: CollectionName, id: string | number): Promise<T | null> => {
    return runTransaction<T>(collection, 'readonly', store => store.get(id))
      .then(res => res || null);
  },

  create: async <T>(collection: CollectionName, item: T): Promise<T> => {
    const newItem = { 
      id: (item as any).id || (typeof item === 'object' && 'id' in (item as any) ? (item as any).id : Date.now().toString()),
      ...item,
      created_at: (item as any).created_at || new Date().toISOString()
    };
    await runTransaction(collection, 'readwrite', store => store.add(newItem));
    return newItem;
  },

  upsert: async <T>(collection: CollectionName, item: T): Promise<T> => {
    const newItem = { 
      id: (item as any).id || (typeof item === 'object' && 'id' in (item as any) ? (item as any).id : Date.now().toString()),
      ...item
    };
    await runTransaction(collection, 'readwrite', store => store.put(newItem));
    return newItem;
  },

  update: async <T>(collection: CollectionName, id: string | number, updates: Partial<T>): Promise<T | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(collection, 'readwrite');
      const store = tx.objectStore(collection);
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result;
        if (!data) {
          resolve(null);
          return;
        }
        const updatedItem = { ...data, ...updates };
        store.put(updatedItem);
        resolve(updatedItem);
      };
      
      request.onerror = () => reject(request.error);
    });
  },

  delete: async (collection: CollectionName, id: string | number): Promise<boolean> => {
    await runTransaction(collection, 'readwrite', store => store.delete(id));
    return true;
  },

  findUserByEmail: async (email: string) => {
    const users = await db.getAll<any>('users');
    return users.find((u: any) => u.email === email);
  }
};
