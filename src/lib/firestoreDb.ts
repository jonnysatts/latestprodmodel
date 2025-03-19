import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  Timestamp,
  DocumentData,
  Firestore
} from 'firebase/firestore';
import { db } from './firebase';
import type { 
  Product, 
  GrowthMetrics, 
  RevenueMetrics, 
  CostMetrics, 
  CustomerMetrics 
} from '../types';

// Firestore Collection Names
const PRODUCTS_COLLECTION = 'products';
const METRICS_COLLECTION = 'metrics';
const PROJECTIONS_COLLECTION = 'projections';
const ACTUALS_COLLECTION = 'actuals';
const MARKETING_KPIS_COLLECTION = 'marketingKpis';

// Error Handling
export function handleFirestoreError(error: unknown): never {
  console.error('Firestore operation failed:', error);
  if (error instanceof Error) {
    throw error;
  }
  throw new Error('An unexpected Firestore error occurred');
}

// Helper to convert Firestore timestamps to Dates in objects
const convertTimestamps = (obj: DocumentData): unknown => {
  const result: unknown = { ...obj };
  Object.keys(result).forEach(key => {
    // Convert timestamps to Date objects
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate();
    }
    // Recursively convert timestamps in nested objects
    else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = convertTimestamps(result[key]);
    }
  });
  return result;
};

// PRODUCT OPERATIONS

// Get all products
export async function getProducts(): Promise<Product[]> {
  try {
    const productsRef = collection(db as Firestore, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(productsRef);
    
    const products: Product[] = [];
    snapshot.forEach(doc => {
      const productData = convertTimestamps(doc.data());
      // Make sure product has proper structure
      if (!productData.info) {
        productData.info = { id: doc.id, name: '', description: '', type: 'Experiential Events' };
      }
      if (!productData.info.id) {
        productData.info.id = doc.id;
      }
      products.push(productData as Product);
    });
    
    return products;
  } catch (error) {
    handleFirestoreError(error);
    throw error; // Unreachable due to handleFirestoreError, but keeps TypeScript happy
  }
}

// Create a new product
export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  try {
    // Generate a unique ID
    const productId = crypto.randomUUID();
    
    // Create the product object with the generated ID
    const newProduct = {
      ...product,
      info: {
        ...product.info,
        id: productId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } as Product;
    
    // Set the document with the generated ID
    await setDoc(doc(db as Firestore, PRODUCTS_COLLECTION, productId), {
      ...newProduct,
      // Add server timestamp for cloud-based tracking
      _createdAt: serverTimestamp(),
      _updatedAt: serverTimestamp()
    });
    
    return newProduct;
  } catch (error) {
    handleFirestoreError(error);
    throw error;
  }
}

// Update a product
export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<void> {
  try {
    // Reference to the product document
    const productRef = doc(db as Firestore, PRODUCTS_COLLECTION, id);
    
    // Get the current product
    const productDoc = await getDoc(productRef);
    if (!productDoc.exists()) {
      throw new Error(`Product with ID ${id} not found`);
    }
    
    // Add updatedAt timestamp to the info object
    const updatedProduct: Record<string, any> = {
      ...updates,
      info: updates.info ? {
        ...updates.info,
        updatedAt: new Date()
      } : undefined,
      _updatedAt: serverTimestamp()
    };
    
    // Remove undefined fields
    Object.keys(updatedProduct).forEach(key => 
      updatedProduct[key] === undefined && delete updatedProduct[key]
    );
    
    // Update the document
    await updateDoc(productRef, updatedProduct);
  } catch (error) {
    handleFirestoreError(error);
    throw error;
  }
}

// Delete a product
export async function deleteProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db as Firestore, PRODUCTS_COLLECTION, id));
    
    // Later we could also clean up related subcollections here
    // For now, we'll leave that as a future improvement
  } catch (error) {
    handleFirestoreError(error);
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
    const productRef = doc(db as Firestore, PRODUCTS_COLLECTION, productId);
    
    // Get the current product
    const productDoc = await getDoc(productRef);
    if (!productDoc.exists()) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    const product = productDoc.data() as Product;
    
    // Create the update object
    const updateData: Record<string, any> = {
      _updatedAt: serverTimestamp()
    };
    
    // Only include fields that are being updated
    if (updates.growthMetrics) {
      updateData.growthMetrics = {
        ...product.growthMetrics,
        ...updates.growthMetrics
      };
    }
    
    if (updates.revenueMetrics) {
      updateData.revenueMetrics = {
        ...product.revenueMetrics,
        ...updates.revenueMetrics
      };
    }
    
    if (updates.costMetrics) {
      updateData.costMetrics = {
        ...product.costMetrics,
        ...updates.costMetrics
      };
    }
    
    if (updates.customerMetrics) {
      updateData.customerMetrics = {
        ...product.customerMetrics,
        ...updates.customerMetrics
      };
    }
    
    // Update the document
    await updateDoc(productRef, updateData);
  } catch (error) {
    handleFirestoreError(error);
    throw error;
  }
}

// Update weekly projections
export async function updateProjections(
  productId: string, 
  weeklyProjections: unknown[]
): Promise<void> {
  try {
    const productRef = doc(db as Firestore, PRODUCTS_COLLECTION, productId);
    
    // Get the current product
    const productDoc = await getDoc(productRef);
    if (!productDoc.exists()) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    // Ensure each projection has an ID
    const updatedProjections = weeklyProjections.map(projection => ({
      ...projection,
      id: projection.id || crypto.randomUUID()
    }));
    
    // Update the document
    await updateDoc(productRef, {
      weeklyProjections: updatedProjections,
      _updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error);
    throw error;
  }
}

// Update actual metrics
export async function updateActuals(
  productId: string,
  actualMetrics: unknown[]
): Promise<void> {
  try {
    const productRef = doc(db as Firestore, PRODUCTS_COLLECTION, productId);
    
    // Get the current product
    const productDoc = await getDoc(productRef);
    if (!productDoc.exists()) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    const product = productDoc.data() as Product;
    
    // Ensure each metric has an ID
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
    const existingMetrics = product.actualMetrics || [];
    const combinedMetrics = existingMetrics
      .filter(metric => !metricsById.has(metric.id))
      .concat(Array.from(metricsById.values()));
    
    // Update the document
    await updateDoc(productRef, {
      actualMetrics: combinedMetrics,
      _updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error);
    throw error;
  }
}

// For future enhancement: implement subcollections
// Instead of storing all data in a single document, we could use subcollections:
// - /products/{productId}/projections/{projectionId}
// - /products/{productId}/actuals/{actualId}
// This would be better for scalability with large numbers of projections or actuals 

// MARKETING KPI OPERATIONS

// Get marketing KPIs for a product
export async function getMarketingKPIs(productId: string): Promise<any[]> {
  try {
    const kpisRef = collection(db as Firestore, MARKETING_KPIS_COLLECTION);
    const q = query(kpisRef, where("productId", "==", productId));
    const snapshot = await getDocs(q);
    
    const kpis: unknown[] = [];
    snapshot.forEach(doc => {
      const kpiData = convertTimestamps(doc.data());
      kpis.push({
        ...kpiData,
        id: doc.id
      });
    });
    
    return kpis;
  } catch (error) {
    handleFirestoreError(error);
    throw error;
  }
}

// Add a new marketing KPI
export async function addMarketingKPI(productId: string, kpi: any): Promise<string> {
  try {
    // Generate a unique ID if not provided
    const kpiId = kpi.id || crypto.randomUUID();
    
    // Create the KPI with productId
    const kpiWithProductId = {
      ...kpi,
      productId,
      id: kpiId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Set the document with the generated ID
    await setDoc(doc(db as Firestore, MARKETING_KPIS_COLLECTION, kpiId), kpiWithProductId);
    
    return kpiId;
  } catch (error) {
    handleFirestoreError(error);
    throw error;
  }
}

// Update a marketing KPI
export async function updateMarketingKPI(kpiId: string, updates: any): Promise<void> {
  try {
    const kpiRef = doc(db as Firestore, MARKETING_KPIS_COLLECTION, kpiId);
    
    // Add updated timestamp
    const updatedKpi = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    // Update the document
    await updateDoc(kpiRef, updatedKpi);
  } catch (error) {
    handleFirestoreError(error);
    throw error;
  }
}

// Delete a marketing KPI
export async function deleteMarketingKPI(kpiId: string): Promise<void> {
  try {
    await deleteDoc(doc(db as Firestore, MARKETING_KPIS_COLLECTION, kpiId));
  } catch (error) {
    handleFirestoreError(error);
    throw error;
  }
} 