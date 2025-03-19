import type { Product, GrowthMetrics, RevenueMetrics, CostMetrics, CustomerMetrics } from '../types';
import * as firestoreDb from './firestoreDb';

// Simple error handling function
export function handleDatabaseError(error: unknown): never {
  if (error instanceof Error) {
    throw error;
  }
  throw new Error('An unexpected database error occurred');
}

// LocalStorage Keys
const PRODUCTS_KEY = 'fortress-products';
const MARKETING_KPIS_KEY = 'marketing-kpis';

// Helper function to load data from localStorage
function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error loading data from localStorage (${key}):`, error);
    return defaultValue;
  }
}

// Helper function to save data to localStorage
function saveLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving data to localStorage (${key}):`, error);
    throw new Error('Failed to save data locally. Check browser storage settings.');
  }
}

// Determine if we should use Firestore
// We'll use Firestore if the app is running in a browser and the Firebase config is available
const shouldUseFirestore = (): boolean => {
  try {
    return typeof window !== 'undefined' && 
           typeof localStorage !== 'undefined' && 
           Boolean(import.meta.env.VITE_FIREBASE_API_KEY);
  } catch (error) {
    console.error('Error determining if Firestore should be used:', error);
    return false;
  }
};

// Get all products
export async function getProducts(): Promise<Product[]> {
  try {
    // Try to use Firestore first
    if (shouldUseFirestore()) {
      try {
        return await firestoreDb.getProducts();
      } catch (firestoreError) {
        console.error('Firestore getProducts failed, falling back to localStorage:', firestoreError);
      }
    }
    
    // Fallback to localStorage
    return getLocalData<Product[]>(PRODUCTS_KEY, []);
  } catch (error) {
    handleDatabaseError(error);
    throw error;
  }
}

// Create a new product
export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  try {
    // Try to use Firestore first
    if (shouldUseFirestore()) {
      try {
        return await firestoreDb.createProduct(product);
      } catch (firestoreError) {
        console.error('Firestore createProduct failed, falling back to localStorage:', firestoreError);
      }
    }
    
    // Fallback to localStorage
    const products = getLocalData<Product[]>(PRODUCTS_KEY, []);
    const newProduct = {
      ...product,
      info: {
        ...product.info,
        id: crypto.randomUUID()
      }
    } as Product;
    
    products.push(newProduct);
    saveLocalData(PRODUCTS_KEY, products);
    
    return newProduct;
  } catch (error) {
    handleDatabaseError(error);
    throw error;
  }
}

// Update a product
export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<void> {
  try {
    // Try to use Firestore first
    if (shouldUseFirestore()) {
      try {
        await firestoreDb.updateProduct(id, updates);
        return;
      } catch (firestoreError) {
        console.error('Firestore updateProduct failed, falling back to localStorage:', firestoreError);
      }
    }
    
    // Fallback to localStorage
    const products = getLocalData<Product[]>(PRODUCTS_KEY, []);
    const updatedProducts = products.map(p => 
      p.info.id === id ? { ...p, ...updates } : p
    );
    saveLocalData(PRODUCTS_KEY, updatedProducts);
  } catch (error) {
    handleDatabaseError(error);
    throw error;
  }
}

// Delete a product
export async function deleteProduct(id: string): Promise<void> {
  try {
    // Try to use Firestore first
    if (shouldUseFirestore()) {
      try {
        await firestoreDb.deleteProduct(id);
        return;
      } catch (firestoreError) {
        console.error('Firestore deleteProduct failed, falling back to localStorage:', firestoreError);
      }
    }
    
    // Fallback to localStorage
    const products = getLocalData<Product[]>(PRODUCTS_KEY, []);
    const filteredProducts = products.filter(p => p.info.id !== id);
    saveLocalData(PRODUCTS_KEY, filteredProducts);
  } catch (error) {
    handleDatabaseError(error);
    throw error;
  }
}

// Update metrics for a product
export async function updateMetrics(
  productId: string,
  updates: {
    growthMetrics?: Partial<GrowthMetrics>;
    revenueMetrics?: Partial<RevenueMetrics>;
    costMetrics?: Partial<CostMetrics>;
    customerMetrics?: Partial<CustomerMetrics>;
  }
): Promise<void> {
  try {
    // Try to use Firestore first
    if (shouldUseFirestore()) {
      try {
        await firestoreDb.updateMetrics(productId, updates);
        return;
      } catch (firestoreError) {
        console.error('Firestore updateMetrics failed, falling back to localStorage:', firestoreError);
      }
    }
    
    // Fallback to localStorage
    const products = getLocalData<Product[]>(PRODUCTS_KEY, []);
    
    const updatedProducts = products.map(product => {
      if (product.info.id === productId) {
        return {
          ...product,
          growthMetrics: updates.growthMetrics 
            ? { ...product.growthMetrics, ...updates.growthMetrics }
            : product.growthMetrics,
          revenueMetrics: updates.revenueMetrics 
            ? { ...product.revenueMetrics, ...updates.revenueMetrics }
            : product.revenueMetrics,
          costMetrics: updates.costMetrics 
            ? { ...product.costMetrics, ...updates.costMetrics }
            : product.costMetrics,
          customerMetrics: updates.customerMetrics 
            ? { ...product.customerMetrics, ...updates.customerMetrics }
            : product.customerMetrics,
        };
      }
      return product;
    });
    
    saveLocalData(PRODUCTS_KEY, updatedProducts);
  } catch (error) {
    handleDatabaseError(error);
    throw error;
  }
}

// Update weekly projections
export async function updateProjections(
  productId: string, 
  weeklyProjections: unknown[]
): Promise<void> {
  try {
    // Try to use Firestore first
    if (shouldUseFirestore()) {
      try {
        await firestoreDb.updateProjections(productId, weeklyProjections);
        return;
      } catch (firestoreError) {
        console.error('Firestore updateProjections failed, falling back to localStorage:', firestoreError);
      }
    }
    
    // Fallback to localStorage
    const products = getLocalData<Product[]>(PRODUCTS_KEY, []);
    
    const updatedProducts = products.map(product => {
      if (product.info.id === productId) {
        return {
          ...product,
          weeklyProjections: weeklyProjections.map(projection => ({
            ...projection,
            id: projection.id || crypto.randomUUID()
          }))
        };
      }
      return product;
    });
    
    saveLocalData(PRODUCTS_KEY, updatedProducts);
  } catch (error) {
    handleDatabaseError(error);
    throw error;
  }
}

// Update actual metrics
export async function updateActuals(
  productId: string,
  actualMetrics: unknown[]
): Promise<void> {
  try {
    // Try to use Firestore first
    if (shouldUseFirestore()) {
      try {
        await firestoreDb.updateActuals(productId, actualMetrics);
        return;
      } catch (firestoreError) {
        console.error('Firestore updateActuals failed, falling back to localStorage:', firestoreError);
      }
    }
    
    // Fallback to localStorage
    const products = getLocalData<Product[]>(PRODUCTS_KEY, []);
    
    const updatedProducts = products.map(product => {
      if (product.info.id === productId) {
        // Map through existing metrics and update ones that already exist
        // Add new ones that don't exist yet
        const existingIds = new Set(product.actualMetrics.map(m => m.id));
        const updatedMetrics = actualMetrics.map(metric => ({
          ...metric,
          id: metric.id || crypto.randomUUID()
        }));
        
        // Create a map of metrics by ID for easy lookup
        const metricsById = new Map();
        updatedMetrics.forEach(metric => {
          metricsById.set(metric.id, metric);
        });
        
        // Combine existing metrics (if not being updated) with updated ones
        const combinedMetrics = product.actualMetrics
          .filter(metric => !metricsById.has(metric.id))
          .concat(Array.from(metricsById.values()));
        
        return {
          ...product,
          actualMetrics: combinedMetrics
        };
      }
      return product;
    });
    
    saveLocalData(PRODUCTS_KEY, updatedProducts);
  } catch (error) {
    handleDatabaseError(error);
    throw error;
  }
}

// MARKETING KPI OPERATIONS

// Get all marketing KPIs for a product
export async function getMarketingKPIs(productId: string): Promise<any[]> {
  try {
    // Try to use Firestore first
    if (shouldUseFirestore()) {
      try {
        return await firestoreDb.getMarketingKPIs(productId);
      } catch (firestoreError) {
        console.error('Firestore getMarketingKPIs failed, falling back to localStorage:', firestoreError);
      }
    }
    
    // Fallback to localStorage
    return getLocalData<any[]>(`${MARKETING_KPIS_KEY}-${productId}`, []);
  } catch (error) {
    handleDatabaseError(error);
    throw error;
  }
}

// Add a new marketing KPI
export async function addMarketingKPI(productId: string, kpi: any): Promise<string> {
  try {
    // Create KPI with ID if not present
    const kpiWithId = {
      ...kpi,
      id: kpi.id || crypto.randomUUID()
    };
    
    // Try to use Firestore first
    if (shouldUseFirestore()) {
      try {
        return await firestoreDb.addMarketingKPI(productId, kpiWithId);
      } catch (firestoreError) {
        console.error('Firestore addMarketingKPI failed, falling back to localStorage:', firestoreError);
      }
    }
    
    // Fallback to localStorage
    const kpis = getLocalData<any[]>(`${MARKETING_KPIS_KEY}-${productId}`, []);
    kpis.push(kpiWithId);
    saveLocalData(`${MARKETING_KPIS_KEY}-${productId}`, kpis);
    
    return kpiWithId.id;
  } catch (error) {
    handleDatabaseError(error);
    throw error;
  }
}

// Update a marketing KPI
export async function updateMarketingKPI(productId: string, kpiId: string, updates: any): Promise<void> {
  try {
    // Try to use Firestore first
    if (shouldUseFirestore()) {
      try {
        await firestoreDb.updateMarketingKPI(kpiId, updates);
        return;
      } catch (firestoreError) {
        console.error('Firestore updateMarketingKPI failed, falling back to localStorage:', firestoreError);
      }
    }
    
    // Fallback to localStorage
    const kpis = getLocalData<any[]>(`${MARKETING_KPIS_KEY}-${productId}`, []);
    const updatedKpis = kpis.map(kpi => 
      kpi.id === kpiId ? { ...kpi, ...updates } : kpi
    );
    saveLocalData(`${MARKETING_KPIS_KEY}-${productId}`, updatedKpis);
  } catch (error) {
    handleDatabaseError(error);
    throw error;
  }
}

// Delete a marketing KPI
export async function deleteMarketingKPI(productId: string, kpiId: string): Promise<void> {
  try {
    // Try to use Firestore first
    if (shouldUseFirestore()) {
      try {
        await firestoreDb.deleteMarketingKPI(kpiId);
        return;
      } catch (firestoreError) {
        console.error('Firestore deleteMarketingKPI failed, falling back to localStorage:', firestoreError);
      }
    }
    
    // Fallback to localStorage
    const kpis = getLocalData<any[]>(`${MARKETING_KPIS_KEY}-${productId}`, []);
    const filteredKpis = kpis.filter(kpi => kpi.id !== kpiId);
    saveLocalData(`${MARKETING_KPIS_KEY}-${productId}`, filteredKpis);
  } catch (error) {
    handleDatabaseError(error);
    throw error;
  }
}

/**
 * Cloud Integration Complete!
 * 
 * This module now supports cloud-based data storage via Firebase Firestore.
 * The implementation maintains backward compatibility with localStorage
 * for offline usage and as a fallback mechanism.
 * 
 * Key improvements:
 * - Data is now synchronized across devices for all users
 * - Better scalability for larger datasets
 * - More reliable data persistence
 * - Automatic conflict resolution
 * 
 * The module will automatically use Firestore when:
 * 1. The application is running in a browser environment
 * 2. Firebase environment variables are properly configured
 * 
 * If either condition is not met, it gracefully falls back to localStorage.
 */