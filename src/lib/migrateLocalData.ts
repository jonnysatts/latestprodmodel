import React from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Firestore,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import type { Product, Scenario } from '../types';

// Constants
const PRODUCTS_KEY = 'products';
const SCENARIOS_KEY = 'scenarios';
const MARKETING_API_CONFIGS_KEY = 'marketingApiConfigs';
const MARKETING_KPIS_PREFIX = 'marketing-kpis-';
const MIGRATION_COMPLETED_KEY = 'firestoreMigrationCompleted';

// Collection names in Firestore
const PRODUCTS_COLLECTION = 'products';
const SCENARIOS_COLLECTION = 'scenarios';
const MARKETING_KPIS_COLLECTION = 'marketingKpis';

// Type for tracking migration status
export interface MigrationStatus {
  inProgress: boolean;
  completed: boolean;
  productsTotal: number;
  productsMigrated: number;
  scenariosTotal: number;
  scenariosMigrated: number;
  kpisTotal: number;
  kpisMigrated: number;
  errors: string[];
}

const initialStatus: MigrationStatus = {
  inProgress: false,
  completed: false,
  productsTotal: 0,
  productsMigrated: 0,
  scenariosTotal: 0,
  scenariosMigrated: 0,
  kpisTotal: 0,
  kpisMigrated: 0,
  errors: []
};

/**
 * Check if there is data in localStorage that needs to be migrated
 * and if Firestore is empty
 */
export const checkMigrationNeeded = async (): Promise<boolean> => {
  try {
    // Check if migration was already completed
    const migrationCompleted = localStorage.getItem(MIGRATION_COMPLETED_KEY);
    if (migrationCompleted === 'true') {
      return false;
    }

    // Check if there's data in localStorage
    const productsJson = localStorage.getItem(PRODUCTS_KEY);
    const scenariosJson = localStorage.getItem(SCENARIOS_KEY);

    const hasLocalData = !!(productsJson || scenariosJson);
    if (!hasLocalData) {
      return false;
    }

    // Check if Firestore already has data
    if (!db) {
      console.warn('Firebase DB is not initialized');
      return false;
    }
    
    const productsCollection = collection(db as Firestore, PRODUCTS_COLLECTION);
    const productsSnapshot = await getDocs(productsCollection);
    
    // If Firestore already has data, no need to migrate
    if (!productsSnapshot.empty) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
};

/**
 * Migrate products from localStorage to Firestore
 */
const migrateProducts = async (
  updateStatus: (update: Partial<MigrationStatus> | ((prev: MigrationStatus) => Partial<MigrationStatus>)) => void
): Promise<void> => {
  const productsJson = localStorage.getItem(PRODUCTS_KEY);
  if (!productsJson) {
    return;
  }
  
  if (!db) {
    console.warn('Firebase DB is not initialized');
    updateStatus((prev: MigrationStatus) => ({ 
      errors: [...prev.errors, 'Firebase DB is not initialized'] 
    }));
    return;
  }

  try {
    const products = JSON.parse(productsJson) as Record<string, Product>;
    const productIds = Object.keys(products);
    updateStatus({ productsTotal: productIds.length });

    for (const productId of productIds) {
      try {
        const product = products[productId];
        
        // Ensure the product has an ID
        if (!product.info?.id) {
          throw new Error(`Product has no ID: ${JSON.stringify(product)}`);
        }

        const productRef = doc(db as Firestore, PRODUCTS_COLLECTION, product.info.id);
        
        // Add timestamps for creation and updates
        const productWithTimestamps = {
          ...product,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await setDoc(productRef, productWithTimestamps);
        updateStatus((prev: MigrationStatus) => ({ 
          productsMigrated: prev.productsMigrated + 1 
        }));
      } catch (error) {
        const errorMessage = `Failed to migrate product ${productId}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        updateStatus((prev: MigrationStatus) => ({ 
          errors: [...prev.errors, errorMessage] 
        }));
      }
    }
  } catch (error) {
    const errorMessage = `Failed to parse products from localStorage: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    updateStatus((prev: MigrationStatus) => ({ 
      errors: [...prev.errors, errorMessage] 
    }));
  }
};

/**
 * Migrate scenarios from localStorage to Firestore
 */
const migrateScenarios = async (
  updateStatus: (update: Partial<MigrationStatus> | ((prev: MigrationStatus) => Partial<MigrationStatus>)) => void
): Promise<void> => {
  const scenariosJson = localStorage.getItem(SCENARIOS_KEY);
  if (!scenariosJson) {
    return;
  }
  
  if (!db) {
    console.warn('Firebase DB is not initialized');
    updateStatus((prev: MigrationStatus) => ({ 
      errors: [...prev.errors, 'Firebase DB is not initialized'] 
    }));
    return;
  }

  try {
    const scenarios = JSON.parse(scenariosJson) as Record<string, Scenario>;
    const scenarioIds = Object.keys(scenarios);
    updateStatus({ scenariosTotal: scenarioIds.length });

    for (const scenarioId of scenarioIds) {
      try {
        const scenario = scenarios[scenarioId];
        
        // Ensure the scenario has an ID
        if (!scenario.id) {
          throw new Error(`Scenario has no ID: ${JSON.stringify(scenario)}`);
        }

        const scenarioRef = doc(db as Firestore, SCENARIOS_COLLECTION, scenario.id);
        
        // Add timestamps for creation and updates
        const scenarioWithTimestamps = {
          ...scenario,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await setDoc(scenarioRef, scenarioWithTimestamps);
        updateStatus((prev: MigrationStatus) => ({ 
          scenariosMigrated: prev.scenariosMigrated + 1 
        }));
      } catch (error) {
        const errorMessage = `Failed to migrate scenario ${scenarioId}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        updateStatus((prev: MigrationStatus) => ({ 
          errors: [...prev.errors, errorMessage] 
        }));
      }
    }
  } catch (error) {
    const errorMessage = `Failed to parse scenarios from localStorage: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    updateStatus((prev: MigrationStatus) => ({ 
      errors: [...prev.errors, errorMessage] 
    }));
  }
};

/**
 * Migrate marketing KPIs from localStorage to Firestore
 */
const migrateMarketingKPIs = async (
  updateStatus: (update: Partial<MigrationStatus> | ((prev: MigrationStatus) => Partial<MigrationStatus>)) => void
): Promise<void> => {
  if (!db) {
    console.warn('Firebase DB is not initialized');
    updateStatus((prev: MigrationStatus) => ({ 
      errors: [...prev.errors, 'Firebase DB is not initialized for marketing KPI migration'] 
    }));
    return;
  }

  // Look for marketing KPI data in localStorage
  let totalKpis = 0;
  let migratedKpis = 0;
  
  try {
    // Find all marketing KPI keys
    const kpiKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(MARKETING_KPIS_PREFIX)) {
        kpiKeys.push(key);
      }
    }
    
    if (kpiKeys.length === 0) {
      return; // No KPIs to migrate
    }
    
    // Count total KPIs to migrate
    let allKpis: { kpi: any, productId: string }[] = [];
    
    for (const key of kpiKeys) {
      try {
        const kpisJson = localStorage.getItem(key);
        if (!kpisJson) continue;
        
        // Extract product ID from the key
        const productId = key.replace(MARKETING_KPIS_PREFIX, '');
        if (!productId) continue;
        
        const kpis = JSON.parse(kpisJson);
        if (!Array.isArray(kpis)) continue;
        
        // Add productId to each KPI if not present
        const kpisWithProductId = kpis.map(kpi => ({
          ...kpi,
          productId: kpi.productId || productId
        }));
        
        allKpis = [...allKpis, ...kpisWithProductId.map(kpi => ({ kpi, productId }))];
      } catch (error) {
        const errorMessage = `Failed to parse KPIs from key ${key}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        updateStatus((prev: MigrationStatus) => ({ 
          errors: [...prev.errors, errorMessage] 
        }));
      }
    }
    
    totalKpis = allKpis.length;
    updateStatus({ kpisTotal: totalKpis });
    
    // Migrate each KPI
    for (const { kpi, productId } of allKpis) {
      try {
        if (!kpi.id) {
          throw new Error(`KPI has no ID: ${JSON.stringify(kpi)}`);
        }
        
        const kpiRef = doc(db as Firestore, MARKETING_KPIS_COLLECTION, kpi.id);
        
        // Add timestamps and productId
        const kpiWithTimestamps = {
          ...kpi,
          productId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(kpiRef, kpiWithTimestamps);
        migratedKpis++;
        updateStatus((prev: MigrationStatus) => ({ 
          kpisMigrated: prev.kpisMigrated + 1 
        }));
      } catch (error) {
        const errorMessage = `Failed to migrate KPI: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        updateStatus((prev: MigrationStatus) => ({ 
          errors: [...prev.errors, errorMessage] 
        }));
      }
    }
  } catch (error) {
    const errorMessage = `Failed during marketing KPI migration: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    updateStatus((prev: MigrationStatus) => ({ 
      errors: [...prev.errors, errorMessage] 
    }));
  }
};

/**
 * Migrate data from localStorage to Firestore
 */
export const migrateLocalDataToFirestore = async (
  setStatus: React.Dispatch<React.SetStateAction<MigrationStatus | null>>
): Promise<void> => {
  // Initialize status
  setStatus(initialStatus);
  
  // Update status with partial updates
  const updateStatus = (update: Partial<MigrationStatus> | ((prev: MigrationStatus) => Partial<MigrationStatus>)) => {
    setStatus(prevStatus => {
      if (!prevStatus) return null;
      
      const newUpdate = typeof update === 'function' 
        ? update(prevStatus) 
        : update;
        
      return { ...prevStatus, ...newUpdate };
    });
  };

  try {
    // Start migration
    updateStatus({ inProgress: true });
    
    // Migrate products
    await migrateProducts(updateStatus);
    
    // Migrate scenarios
    await migrateScenarios(updateStatus);
    
    // Migrate marketing KPIs
    await migrateMarketingKPIs(updateStatus);
    
    // Mark migration as completed
    localStorage.setItem(MIGRATION_COMPLETED_KEY, 'true');
    
    // Update status
    updateStatus({ inProgress: false, completed: true });
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = `Migration failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    
    // Get the current status to append the error
    setStatus(currentStatus => {
      if (!currentStatus) return null;
      
      return {
        ...currentStatus,
        inProgress: false,
        completed: true,
        errors: [...currentStatus.errors, errorMessage]
      };
    });
  }
};

/**
 * Creates a migration component to display in the UI
 */
export const createMigrationComponent = () => {
  // This would be implemented separately and imported where needed
}; 