import { 
  MOCK_CLIENTS, MOCK_EMPLOYEES, MOCK_FINANCIALS, 
  MOCK_INVENTORY, MOCK_SERVICES, MOCK_TENANT, 
  MOCK_USER, MOCK_WORK_ORDERS, MOCK_ALERTS, MOCK_REMINDERS, MOCK_REWARDS, MOCK_EMPLOYEE_TRANSACTIONS
} from './mockData';

const DB_NAME = 'cristal_care_idb';
const DB_VERSION = 2; // Incremented version for schema changes
const LOCAL_STORAGE_KEY = 'cristal_care_local_db_v1';

// List of all object stores (collections)
const COLLECTIONS = [
  'clients', 
  'vehicles', // Added vehicles collection
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
  'message_logs'
] as const;

type CollectionName = typeof COLLECTIONS[number];

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

// Open IndexedDB Connection
const openDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      COLLECTIONS.forEach(col => {
        if (!db.objectStoreNames.contains(col)) {
          // Create object store with 'id' as keyPath
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

// Helper to run a transaction
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

// Initialize DB: Migrate from LocalStorage OR Seed Mocks
const initializeDB = async () => {
  try {
    const db = await openDB();
    
    // 1. Check if we need to migrate from LocalStorage (Legacy)
    const existingLocalData = localStorage.getItem(LOCAL_STORAGE_KEY);
    
    if (existingLocalData) {
      console.log('Migrating data from LocalStorage to IndexedDB...');
      try {
        const parsedData = JSON.parse(existingLocalData);
        const tx = db.transaction(COLLECTIONS, 'readwrite');
        
        let hasError = false;

        COLLECTIONS.forEach(col => {
          if (parsedData[col] && Array.isArray(parsedData[col])) {
            const store = tx.objectStore(col);
            parsedData[col].forEach((item: any) => {
              // Ensure ID exists
              if (!item.id) item.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
              store.put(item);
            });
          }
        });

        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => { hasError = true; reject(tx.error); };
        });

        if (!hasError) {
          console.log('Migration successful. Clearing LocalStorage.');
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      } catch (e) {
        console.error('Migration failed:', e);
      }
      return;
    }

    // 2. If no local data, check if IDB is empty (Fresh Start)
    const userCount = await runTransaction<number>('users', 'readonly', store => store.count());
    
    // CHECK FOR SKIP SEEDING FLAG (To allow clean registration)
    const shouldSkipSeeding = localStorage.getItem('skip_seeding') === 'true';
    
    if (userCount === 0 && !shouldSkipSeeding) {
      console.log('Seeding IndexedDB with Mock Data...');
      const tx = db.transaction(COLLECTIONS, 'readwrite');
      
      const seed = (col: CollectionName, data: any[]) => {
        const store = tx.objectStore(col);
        data.forEach(item => {
           store.put(item);
        });
      };

      seed('clients', MOCK_CLIENTS);
      // Extract vehicles from clients for seeding if needed, but MOCK_CLIENTS has nested vehicles.
      // We should ideally flatten them here for the new structure.
      const vehicles: any[] = [];
      MOCK_CLIENTS.forEach(c => {
          if (c.vehicles) {
              c.vehicles.forEach(v => {
                  vehicles.push({ ...v, client_id: c.id, tenant_id: MOCK_TENANT.id });
              });
          }
      });
      seed('vehicles', vehicles);

      seed('work_orders', MOCK_WORK_ORDERS);
      seed('inventory', MOCK_INVENTORY);
      seed('services', MOCK_SERVICES);
      seed('employees', MOCK_EMPLOYEES);
      seed('employee_transactions', MOCK_EMPLOYEE_TRANSACTIONS);
      seed('financial_transactions', MOCK_FINANCIALS);
      seed('users', [MOCK_USER]);
      seed('tenants', [MOCK_TENANT]);
      seed('alerts', MOCK_ALERTS);
      seed('reminders', MOCK_REMINDERS);
      seed('rewards', MOCK_REWARDS);
      
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      console.log('Seeding complete.');
    } else if (userCount === 0 && shouldSkipSeeding) {
        console.log('Skipping seed (Clean Install requested).');
    }

  } catch (error) {
    console.error("Failed to initialize DB:", error);
  }
};

const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

export const db = {
  init: initializeDB,

  reset: async (skipSeeding = false) => {
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => {
      localStorage.clear(); // Clear all local storage
      if (skipSeeding) {
          localStorage.setItem('skip_seeding', 'true');
      }
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
